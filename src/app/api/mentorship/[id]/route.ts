import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Get mentorship detail with sessions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const userId = payload!.userId

    const mentorship = await db.mentorship.findUnique({
      where: { id },
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
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!mentorship) {
      return NextResponse.json(
        { error: 'Mentorship non trouvé' },
        { status: 404 }
      )
    }

    // Only the mentor or mentee can view this mentorship
    if (
      mentorship.mentorId !== userId &&
      mentorship.menteeId !== userId &&
      payload!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    return NextResponse.json({ mentorship })
  } catch (error) {
    console.error('Fetch mentorship detail error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Accept or decline a mentorship request (mentor only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "accept" ou "decline"' },
        { status: 400 }
      )
    }

    // Find the mentorship — check that the user is the mentor
    const mentorship = await db.mentorship.findUnique({
      where: { id },
      include: {
        mentor: {
          select: { userId: true, currentMentees: true, maxMentees: true },
        },
      },
    })

    if (!mentorship) {
      return NextResponse.json(
        { error: 'Mentorship non trouvé' },
        { status: 404 }
      )
    }

    if (mentorship.mentor.userId !== payload!.userId && payload!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seul le mentor peut accepter ou refuser cette demande' },
        { status: 403 }
      )
    }

    if (mentorship.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cette demande a déjà été traitée' },
        { status: 400 }
      )
    }

    if (action === 'decline') {
      const updated = await db.mentorship.update({
        where: { id },
        data: { status: 'declined' },
      })

      return NextResponse.json({ mentorship: updated })
    }

    // Accept: check capacity
    if (mentorship.mentor.currentMentees >= mentorship.mentor.maxMentees) {
      return NextResponse.json(
        { error: 'Capacité maximale de mentorés atteinte' },
        { status: 400 }
      )
    }

    const updatedMentorship = await db.mentorship.update({
      where: { id },
      data: { status: 'active', startDate: new Date() },
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

    // Increment current mentees count
    await db.mentor.update({
      where: { id: mentorship.mentorId },
      data: { currentMentees: { increment: 1 } },
    })

    return NextResponse.json({ mentorship: updatedMentorship })
  } catch (error) {
    console.error('Update mentorship error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
