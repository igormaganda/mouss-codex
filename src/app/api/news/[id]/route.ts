import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Get news detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const newsItem = await db.newsItem.findUnique({
      where: { id },
    })

    if (!newsItem) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    // Check if the authenticated user has saved this news item
    let isSaved = false
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { authenticateRequest: auth } = await import('@/lib/auth-middleware')
      const { authenticated, payload } = auth(request)
      if (authenticated && payload) {
        const savedEntry = await db.savedNews.findUnique({
          where: {
            userId_newsId: {
              userId: payload.userId,
              newsId: id,
            },
          },
        })
        isSaved = !!savedEntry
      }
    }

    // Fetch related news (same sector, different id)
    const relatedNews = await db.newsItem.findMany({
      where: {
        id: { not: id },
        OR: newsItem.sectors.length > 0
          ? newsItem.sectors.map((sector) => ({ sectors: { has: sector } }))
          : [{ type: newsItem.type }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        excerpt: true,
        image: true,
        publishedAt: true,
        sectors: true,
      },
    })

    return NextResponse.json({
      newsItem,
      isSaved,
      relatedNews,
    })
  } catch (error) {
    console.error('Fetch news detail error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Update news (ADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  if (payload!.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { type, title, excerpt, content, image, source, sourceUrl, publishedAt, sectors, tags, relevanceScore } = body

    const existingNews = await db.newsItem.findUnique({ where: { id } })
    if (!existingNews) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title.trim()
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (image !== undefined) updateData.image = image || null
    if (source !== undefined) updateData.source = source
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl || null
    if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt)
    if (Array.isArray(sectors)) updateData.sectors = sectors
    if (Array.isArray(tags)) updateData.tags = tags
    if (typeof relevanceScore === 'number') updateData.relevanceScore = relevanceScore

    const newsItem = await db.newsItem.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ newsItem })
  } catch (error) {
    console.error('Update news error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Delete news (ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  if (payload!.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    const existingNews = await db.newsItem.findUnique({ where: { id } })
    if (!existingNews) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    await db.newsItem.delete({ where: { id } })

    return NextResponse.json({ message: 'Article supprimé avec succès' })
  } catch (error) {
    console.error('Delete news error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
