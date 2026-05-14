import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// POST: Create a new interview session
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!
  if (!['COUNSELOR', 'ADMIN'].includes(payload!.role)) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, scheduledAt } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const interview = await db.interviewSession.create({
      data: {
        counselorId: payload!.userId,
        userId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        status: 'SCHEDULED',
      },
      include: {
        user: { select: { id: true, name: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        counselor: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ interview }, { status: 201 })
  } catch (err) {
    console.error('Create interview error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// GET: List interview sessions
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (payload!.role === 'USER') {
      where.userId = payload!.userId
    } else {
      if (userId) where.userId = userId
    }

    const interviews = await db.interviewSession.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        counselor: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { timestamp: 'desc' } },
        phaseTimers: { orderBy: { startedAt: 'asc' } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ interviews })
  } catch (err) {
    console.error('List interviews error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
