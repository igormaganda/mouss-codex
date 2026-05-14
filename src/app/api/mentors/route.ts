import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: List mentors with filters (expertise, location, availability)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const expertise = searchParams.get('expertise')
    const location = searchParams.get('location')
    const availability = searchParams.get('availability')
    const sector = searchParams.get('sector')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')))
    const sortBy = searchParams.get('sortBy') || 'rating'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const whereClause: any = {}

    if (expertise) {
      whereClause.expertise = { has: expertise }
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' }
    }

    if (availability) {
      whereClause.availability = availability
    }

    if (sector) {
      whereClause.sectors = { has: sector }
    }

    // Only show mentors that are accepting mentees
    whereClause.maxMentees = { gt: db.mentor.fields.currentMentees }

    const orderBy: any = {}
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder === 'asc' ? 'asc' : 'desc'
    } else if (sortBy === 'experience') {
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc'
    } else if (sortBy === 'name') {
      orderBy.maxMentees = 'asc'
    }

    const [mentors, total] = await Promise.all([
      db.mentor.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mentor.count({ where: whereClause }),
    ])

    return NextResponse.json({
      mentors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch mentors error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Register as a mentor
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { bio, expertise, sectors, location, maxMentees } = body

    // Check if user already has a mentor profile
    const existingMentor = await db.mentor.findUnique({
      where: { userId: payload!.userId },
    })

    if (existingMentor) {
      return NextResponse.json(
        { error: 'Vous avez déjà un profil mentor' },
        { status: 409 }
      )
    }

    if (!bio || typeof bio !== 'string' || bio.trim().length === 0) {
      return NextResponse.json(
        { error: 'La biographie est requise' },
        { status: 400 }
      )
    }

    if (!Array.isArray(expertise) || expertise.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un domaine d\'expertise est requis' },
        { status: 400 }
      )
    }

    const mentor = await db.mentor.create({
      data: {
        userId: payload!.userId,
        bio: bio.trim(),
        expertise: expertise.map((e: string) => e.trim()),
        sectors: Array.isArray(sectors) ? sectors.map((s: string) => s.trim()) : [],
        location: location ? location.trim() : '',
        maxMentees: typeof maxMentees === 'number' ? Math.min(20, Math.max(1, maxMentees)) : 3,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ mentor }, { status: 201 })
  } catch (error) {
    console.error('Create mentor profile error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
