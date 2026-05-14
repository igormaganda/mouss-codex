import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sector = searchParams.get('sector')

    const where: any = {}
    if (category) where.category = category
    if (sector) where.sector = sector
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ]
    }

    const entries = await db.knowledgeEntry.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('Get knowledge error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!
  if (!['COUNSELOR', 'ADMIN'].includes(payload!.role)) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, content, source, sourceUrl, category, tags, sector, region } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Titre et contenu requis' }, { status: 400 })
    }

    const entry = await db.knowledgeEntry.create({
      data: {
        title,
        content,
        source: source || null,
        sourceUrl: sourceUrl || null,
        category: category || 'general',
        tags: tags || [],
        sector: sector || null,
        region: region || null,
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (err) {
    console.error('Create knowledge entry error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
