import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 9

// GET: List actors with pagination, filtering (type, region, search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const type = searchParams.get('type')
    const region = searchParams.get('region')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')

    const where: Prisma.ActorWhereInput = {}

    if (type) {
      where.type = type
    }

    if (region) {
      where.region = region
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [actors, total] = await Promise.all([
      db.actor.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          favorites: {
            select: { userId: true },
          },
        },
      }),
      db.actor.count({ where }),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return NextResponse.json({
      actors,
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
    console.error('Fetch actors error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST (ADMIN only): Create a new actor
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
    const {
      name,
      shortName,
      type,
      category,
      city,
      region,
      address,
      phone,
      email,
      website,
      description,
      services,
      targetAudience,
      featured,
      successRate,
      projectsSupported,
    } = body

    if (!name || !type || !city) {
      return NextResponse.json(
        { error: 'Les champs name, type et city sont requis' },
        { status: 400 }
      )
    }

    const actor = await db.actor.create({
      data: {
        name: name.trim(),
        shortName: shortName?.trim() || null,
        type: type.trim(),
        category: category?.trim() || null,
        city: city.trim(),
        region: region?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        description: description?.trim() || null,
        services: services || {},
        targetAudience: targetAudience || {},
        featured: !!featured,
        successRate: successRate !== undefined ? parseFloat(successRate) : null,
        projectsSupported: projectsSupported || 0,
      },
    })

    return NextResponse.json({ actor }, { status: 201 })
  } catch (error) {
    console.error('Create actor error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
