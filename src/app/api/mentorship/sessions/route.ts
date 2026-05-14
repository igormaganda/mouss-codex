import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: List sessions for a mentorship (query: mentorshipId)
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const mentorshipId = searchParams.get('mentorshipId')

    if (!mentorshipId) {
      return NextResponse.json(
        { error: 'Le paramètre mentorshipId est requis' },
        { status: 400 }
      )
    }

    const userId = payload!.userId

    // Verify the user is part of this mentorship
    const mentorship = await db.mentorship.findUnique({
      where: { id: mentorshipId },
      select: {
        mentorId: true,
        menteeId: true,
        mentor: { select: { userId: true } },
      },
    })

    if (!mentorship) {
      return NextResponse.json(
        { error: 'Mentorship non trouvé' },
        { status: 404 }
      )
    }

    if (
      mentorship.mentor.userId !== userId &&
      mentorship.menteeId !== userId &&
      payload!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const [sessions, total] = await Promise.all([
      db.mentorshipSession.findMany({
        where: { mentorshipId },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mentorshipSession.count({ where: { mentorshipId } }),
    ])

    const aggregated = await db.mentorshipSession.aggregate({
      where: { mentorshipId },
      _sum: { duration: true },
      _avg: { rating: true },
    })

    return NextResponse.json({
      sessions,
      stats: {
        totalCount: total,
        totalDuration: aggregated._sum.duration || 0,
        averageRating: aggregated._avg.rating
          ? Math.round(aggregated._avg.rating * 10) / 10
          : null,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch sessions error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Create a session and update mentorship status
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { mentorshipId, date, duration, notes, rating } = body

    if (!mentorshipId || typeof mentorshipId !== 'string') {
      return NextResponse.json(
        { error: 'L\'identifiant du mentorship est requis' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'La date de la session est requise' },
        { status: 400 }
      )
    }

    const userId = payload!.userId

    // Verify the user is a participant of this mentorship
    const mentorship = await db.mentorship.findUnique({
      where: { id: mentorshipId },
      include: {
        mentor: {
          select: { userId: true },
        },
      },
    })

    if (!mentorship) {
      return NextResponse.json(
        { error: 'Mentorship non trouvé' },
        { status: 404 }
      )
    }

    if (
      mentorship.mentor.userId !== userId &&
      mentorship.menteeId !== userId &&
      payload!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Seuls les participants du mentorship peuvent créer des sessions' },
        { status: 403 }
      )
    }

    if (mentorship.status !== 'active') {
      return NextResponse.json(
        { error: 'Les sessions ne peuvent être créées que pour un mentorship actif' },
        { status: 400 }
      )
    }

    const sessionDate = new Date(date)
    if (isNaN(sessionDate.getTime())) {
      return NextResponse.json(
        { error: 'Date invalide' },
        { status: 400 }
      )
    }

    const parsedDuration =
      typeof duration === 'number'
        ? Math.min(480, Math.max(15, duration))
        : 60

    const session = await db.mentorshipSession.create({
      data: {
        mentorshipId,
        date: sessionDate,
        duration: parsedDuration,
        notes: notes || null,
        rating:
          typeof rating === 'number'
            ? Math.min(5, Math.max(1, rating))
            : null,
      },
    })

    // Auto-complete mentorship after 6 sessions
    const sessionCount = await db.mentorshipSession.count({
      where: { mentorshipId },
    })

    let statusUpdate: Record<string, unknown> = {}
    if (sessionCount >= 6 && mentorship.status === 'active') {
      statusUpdate = { status: 'completed', endDate: new Date() }
      await db.mentorship.update({
        where: { id: mentorshipId },
        data: statusUpdate,
      })

      // Decrement mentor's current mentees count
      await db.mentor.update({
        where: { id: mentorship.mentorId },
        data: { currentMentees: { decrement: 1 } },
      })
    }

    return NextResponse.json({ session, statusUpdate }, { status: 201 })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
