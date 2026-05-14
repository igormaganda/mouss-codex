import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const assessments = await db.motivationAssessment.findMany({
      where: { userId: payload!.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    return NextResponse.json({ assessments })
  } catch (err) {
    console.error('Get motivations error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { sessionId, motivations, barriers, globalComment } = body

    const assessment = await db.motivationAssessment.create({
      data: {
        userId: payload!.userId,
        sessionId,
        motivations: motivations || [],
        barriers: barriers || [],
        alignmentScore: 0, // will be calculated
        globalComment: globalComment || null,
      },
    })

    return NextResponse.json({ assessment }, { status: 201 })
  } catch (err) {
    console.error('Save motivations error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
