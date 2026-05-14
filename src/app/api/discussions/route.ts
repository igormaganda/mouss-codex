import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 15

// GET: List discussions with category filter, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const categoryId = searchParams.get('categoryId')
    const categorySlug = searchParams.get('categorySlug')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const authorId = searchParams.get('authorId')

    const where: Prisma.DiscussionWhereInput = {}

    if (categoryId) {
      where.categoryId = categoryId
    } else if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (authorId) {
      where.authorId = authorId
    }

    const [discussions, total] = await Promise.all([
      db.discussion.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
            select: {
              id: true,
            },
          },
        },
      }),
      db.discussion.count({ where }),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)

    const enrichedDiscussions = discussions.map((discussion) => ({
      ...discussion,
      replyCount: discussion.replies.length,
    }))

    return NextResponse.json({
      discussions: enrichedDiscussions,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Fetch discussions error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Create a new discussion
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { categoryId, title, content, tags } = body

    if (!categoryId || !title || !content) {
      return NextResponse.json(
        { error: 'Les champs categoryId, title et content sont requis' },
        { status: 400 }
      )
    }

    const categoryExists = await db.discussionCategory.findUnique({
      where: { id: categoryId },
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Catégorie introuvable' },
        { status: 404 }
      )
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Le contenu doit contenir au moins 10 caractères' },
        { status: 400 }
      )
    }

    const discussion = await db.discussion.create({
      data: {
        authorId: payload!.userId,
        categoryId,
        title: title.trim(),
        content: content.trim(),
        tags: Array.isArray(tags) ? tags : [],
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

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    console.error('Create discussion error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
