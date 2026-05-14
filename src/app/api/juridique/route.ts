import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const analyses = await db.juridiqueAnalysis.findMany({
      where: { userId: payload!.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    return NextResponse.json({ analyses })
  } catch (err) {
    console.error('Get juridique error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { sessionId, recommendedStatus, statusComparison, fiscalRegime, socialProtection, keyObligations } = body

    const analysis = await db.juridiqueAnalysis.create({
      data: {
        userId: payload!.userId,
        sessionId,
        recommendedStatus: recommendedStatus || null,
        statusComparison: statusComparison || {},
        fiscalRegime: fiscalRegime || null,
        socialProtection: socialProtection || {},
        keyObligations: keyObligations || [],
      },
    })

    return NextResponse.json({ analysis }, { status: 201 })
  } catch (err) {
    console.error('Save juridique error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
