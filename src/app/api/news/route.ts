import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: List news items with filters (type, sector, page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const sector = searchParams.get('sector')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')))

    const whereClause: any = {}

    if (type) {
      whereClause.type = type
    }

    if (sector) {
      whereClause.sectors = { has: sector }
    }

    if (tag) {
      whereClause.tags = { has: tag }
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [newsItems, total] = await Promise.all([
      db.newsItem.findMany({
        where: whereClause,
        orderBy: [
          { relevanceScore: 'desc' },
          { publishedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.newsItem.count({ where: whereClause }),
    ])

    return NextResponse.json({
      newsItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch news error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Create a news item (ADMIN only)
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  if (payload!.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { type, title, excerpt, content, image, source, sourceUrl, publishedAt, sectors, tags, relevanceScore } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      )
    }

    const newsItem = await db.newsItem.create({
      data: {
        type: type || 'news',
        title: title.trim(),
        excerpt: excerpt || '',
        content: content || '',
        image: image || null,
        source: source || '',
        sourceUrl: sourceUrl || null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        sectors: Array.isArray(sectors) ? sectors : [],
        tags: Array.isArray(tags) ? tags : [],
        relevanceScore: typeof relevanceScore === 'number' ? relevanceScore : 0,
      },
    })

    return NextResponse.json({ newsItem }, { status: 201 })
  } catch (error) {
    console.error('Create news error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
