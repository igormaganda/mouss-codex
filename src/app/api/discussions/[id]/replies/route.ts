import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: List replies for a discussion (threaded with parentId)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const discussion = await db.discussion.findUnique({
      where: { id },
      select: { id: true, isLocked: true },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion non trouvée' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const parentId = searchParams.get('parentId')

    const whereClause: any = { discussionId: id }
    if (parentId) {
      whereClause.parentId = parentId
    } else {
      whereClause.parentId = null
    }

    const [replies, total] = await Promise.all([
      db.reply.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.reply.count({ where: whereClause }),
    ])

    // For top-level replies, fetch child counts
    if (!parentId) {
      const topLevelIds = replies.map((r) => r.id)
      const childCounts = await db.reply.groupBy({
        by: ['parentId'],
        where: {
          parentId: { in: topLevelIds },
        },
        _count: { id: true },
      })

      const countMap = new Map(
        childCounts.map((c) => [c.parentId, c._count.id])
      )

      const repliesWithCounts = replies.map((reply) => ({
        ...reply,
        childCount: countMap.get(reply.id) || 0,
      }))

      return NextResponse.json({
        replies: repliesWithCounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    return NextResponse.json({
      replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch replies error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Add a reply to a discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const body = await request.json()
    const { content, parentId } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le contenu de la réponse est requis' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'La réponse ne peut pas dépasser 5000 caractères' },
        { status: 400 }
      )
    }
    const trimmedContent = content.trim()

    const discussion = await db.discussion.findUnique({
      where: { id },
      select: { id: true, isLocked: true },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion non trouvée' },
        { status: 404 }
      )
    }

    if (discussion.isLocked) {
      return NextResponse.json(
        { error: 'Cette discussion est verrouillée' },
        { status: 403 }
      )
    }

    // Validate parentId if provided
    if (parentId) {
      const parentReply = await db.reply.findFirst({
        where: { id: parentId, discussionId: id },
      })
      if (!parentReply) {
        return NextResponse.json(
          { error: 'Réponse parente non trouvée' },
          { status: 404 }
        )
      }
    }

    const reply = await db.reply.create({
      data: {
        discussionId: id,
        authorId: payload!.userId,
        content: trimmedContent,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    })

    // Increment reply count on discussion
    await db.discussion.update({
      where: { id },
      data: { replyCount: { increment: 1 } },
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Create reply error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
