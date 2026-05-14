import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Get user's saved news
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')))

    const [savedNews, total] = await Promise.all([
      db.savedNews.findMany({
        where: { userId: payload!.userId },
        include: {
          news: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.savedNews.count({
        where: { userId: payload!.userId },
      }),
    ])

    const newsItems = savedNews.map((sn) => ({
      ...sn.news,
      savedAt: sn.createdAt,
    }))

    return NextResponse.json({
      savedNews: newsItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch saved news error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Save or unsave a news item (body: { newsId, action: 'save' | 'unsave' })
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { newsId, action } = body

    if (!newsId || typeof newsId !== 'string') {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'article est requis' },
        { status: 400 }
      )
    }

    if (!action || !['save', 'unsave'].includes(action)) {
      return NextResponse.json(
        { error: 'L\'action doit être "save" ou "unsave"' },
        { status: 400 }
      )
    }

    // Verify the news item exists
    const newsItem = await db.newsItem.findUnique({
      where: { id: newsId },
      select: { id: true },
    })

    if (!newsItem) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    if (action === 'save') {
      // Check if already saved
      const existing = await db.savedNews.findUnique({
        where: {
          userId_newsId: {
            userId: payload!.userId,
            newsId,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { message: 'Article déjà sauvegardé', isSaved: true },
          { status: 200 }
        )
      }

      await db.savedNews.create({
        data: {
          userId: payload!.userId,
          newsId,
        },
      })

      return NextResponse.json(
        { message: 'Article sauvegardé', isSaved: true },
        { status: 201 }
      )
    }

    // action === 'unsave'
    const existing = await db.savedNews.findUnique({
      where: {
        userId_newsId: {
          userId: payload!.userId,
          newsId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { message: 'Article non sauvegardé', isSaved: false },
        { status: 200 }
      )
    }

    await db.savedNews.delete({
      where: {
        userId_newsId: {
          userId: payload!.userId,
          newsId,
        },
      },
    })

    return NextResponse.json({
      message: 'Article retiré des favoris',
      isSaved: false,
    })
  } catch (error) {
    console.error('Toggle saved news error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
