import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Get discussion detail with threaded replies and author info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const discussion = await db.discussion.findUnique({
      where: { id },
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        replies: {
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
        },
      },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion non trouvée' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.discussion.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    // Build threaded reply tree
    const replyMap = new Map<string, any>()
    const topLevelReplies: any[] = []

    for (const reply of discussion.replies) {
      const replyNode = {
        ...reply,
        children: [],
      }
      replyMap.set(reply.id, replyNode)

      if (reply.parentId) {
        const parent = replyMap.get(reply.parentId)
        if (parent) {
          parent.children.push(replyNode)
        } else {
          topLevelReplies.push(replyNode)
        }
      } else {
        topLevelReplies.push(replyNode)
      }
    }

    return NextResponse.json({
      discussion: {
        ...discussion,
        replies: topLevelReplies,
      },
    })
  } catch (error) {
    console.error('Fetch discussion error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Update discussion (pin, lock) — admin/counselor only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const allowedRoles = ['ADMIN', 'COUNSELOR']
  if (!allowedRoles.includes(payload!.role)) {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs et conseillers' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { isPinned, isLocked, title, content, tags } = body

    const existingDiscussion = await db.discussion.findUnique({ where: { id } })
    if (!existingDiscussion) {
      return NextResponse.json(
        { error: 'Discussion non trouvée' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (typeof isPinned === 'boolean') updateData.isPinned = isPinned
    if (typeof isLocked === 'boolean') updateData.isLocked = isLocked
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (Array.isArray(tags)) updateData.tags = tags

    const discussion = await db.discussion.update({
      where: { id },
      data: updateData,
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json({ discussion })
  } catch (error) {
    console.error('Update discussion error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
