import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: List user's mentorships (as mentor or mentee)
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const userId = payload!.userId
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'mentor' or 'mentee'
    const status = searchParams.get('status')

    const whereClause: any = {}

    if (role === 'mentor') {
      whereClause.mentorId = userId
    } else if (role === 'mentee') {
      whereClause.menteeId = userId
    } else {
      whereClause.OR = [
        { mentorId: userId },
        { menteeId: userId },
      ]
    }

    if (status) {
      whereClause.status = status
    }

    const mentorships = await db.mentorship.findMany({
      where: whereClause,
      include: {
        mentor: {
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
        },
        mentee: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        sessions: {
          select: {
            id: true,
            date: true,
            duration: true,
            rating: true,
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with computed fields
    const enrichedMentorships = mentorships.map((m) => ({
      ...m,
      userRole:
        m.mentorId === userId ? ('mentor' as const) : ('mentee' as const),
      sessionCount: m.sessions.length,
      totalDuration: m.sessions.reduce((sum, s) => sum + s.duration, 0),
      averageRating:
        m.sessions.filter((s) => s.rating !== null).length > 0
          ? m.sessions
              .filter((s) => s.rating !== null)
              .reduce((sum, s) => sum + s.rating!, 0) /
            m.sessions.filter((s) => s.rating !== null).length
          : null,
    }))

    return NextResponse.json({ mentorships: enrichedMentorships })
  } catch (error) {
    console.error('Fetch mentorships error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Create a mentorship request
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { mentorId, message, objectives } = body

    if (!mentorId || typeof mentorId !== 'string') {
      return NextResponse.json(
        { error: 'L\'identifiant du mentor est requis' },
        { status: 400 }
      )
    }

    // Validate the mentor exists and has capacity
    const mentor = await db.mentor.findUnique({
      where: { id: mentorId },
    })

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor non trouvé' },
        { status: 404 }
      )
    }

    if (mentor.currentMentees >= mentor.maxMentees) {
      return NextResponse.json(
        { error: 'Ce mentor a atteint sa capacité maximale de mentorés' },
        { status: 400 }
      )
    }

    // Check if mentee already has a pending request with this mentor
    const existingRequest = await db.mentorshipRequest.findFirst({
      where: {
        mentorId,
        menteeId: payload!.userId,
        status: { in: ['pending', 'accepted'] },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Vous avez déjà une demande en cours auprès de ce mentor' },
        { status: 409 }
      )
    }

    // Check if there's already an active mentorship between these two
    const existingMentorship = await db.mentorship.findFirst({
      where: {
        mentorId,
        menteeId: payload!.userId,
        status: { in: ['active', 'paused'] },
      },
    })

    if (existingMentorship) {
      return NextResponse.json(
        { error: 'Vous avez déjà un mentorship actif avec ce mentor' },
        { status: 409 }
      )
    }

    const mentorshipRequest = await db.mentorshipRequest.create({
      data: {
        mentorId,
        menteeId: payload!.userId,
        message: message || '',
        objectives: Array.isArray(objectives) ? objectives : [],
        status: 'pending',
      },
      include: {
        mentor: {
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
        },
        mentee: {
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

    return NextResponse.json({ mentorshipRequest }, { status: 201 })
  } catch (error) {
    console.error('Create mentorship request error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
