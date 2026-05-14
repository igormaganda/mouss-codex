import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { Prisma } from '@prisma/client'

// GET: List all networks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sector = searchParams.get('sector')
    const search = searchParams.get('search')

    const where: Prisma.NetworkWhereInput = {}

    if (sector) {
      where.sector = sector
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const networks = await db.network.findMany({
      where,
      orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ networks })
  } catch (error) {
    console.error('Fetch networks error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST (ADMIN only): Create a network
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
    const { name, description, website, sector, memberCount } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Le champ name est requis' },
        { status: 400 }
      )
    }

    const network = await db.network.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        sector: sector?.trim() || null,
        memberCount: memberCount || 0,
      },
    })

    return NextResponse.json({ network }, { status: 201 })
  } catch (error) {
    console.error('Create network error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
