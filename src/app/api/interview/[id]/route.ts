import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Get single interview with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const interview = await db.interviewSession.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, firstName: true, lastName: true, avatarUrl: true,
            kiviatResults: { orderBy: { createdAt: 'desc' }, take: 6 },
            riasecResults: { orderBy: { createdAt: 'desc' }, take: 6 },
            swipeGameResults: { where: { kept: true } },
            diagnosisSessions: { orderBy: { startedAt: 'desc' }, take: 1 },
            motivationAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
            juridiqueAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
            marketAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        counselor: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { timestamp: 'asc' } },
        phaseTimers: { orderBy: { startedAt: 'asc' } },
      },
    })

    if (!interview) {
      return NextResponse.json({ error: 'Entretien non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ interview })
  } catch (err) {
    console.error('Get interview error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// PATCH: Update interview (status, phase, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!
  if (!['COUNSELOR', 'ADMIN'].includes(payload!.role)) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status, currentPhase } = body

    const interview = await db.interviewSession.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(currentPhase && { currentPhase }),
        ...(status === 'IN_PROGRESS' && !body.startedAt && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    })

    return NextResponse.json({ interview })
  } catch (err) {
    console.error('Update interview error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
