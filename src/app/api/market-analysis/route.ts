import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const analyses = await db.marketAnalysis.findMany({
      where: { userId: payload!.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    return NextResponse.json({ analyses })
  } catch (err) {
    console.error('Get market analysis error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { sessionId, sector, region, marketData, competitors, trends, opportunities, threats, aiSynthesis } = body

    const analysis = await db.marketAnalysis.create({
      data: {
        userId: payload!.userId,
        sessionId,
        sector,
        region,
        marketData: marketData || {},
        competitors: competitors || [],
        trends: trends || [],
        opportunities: opportunities || [],
        threats: threats || [],
        aiSynthesis,
      },
    })

    return NextResponse.json({ analysis }, { status: 201 })
  } catch (err) {
    console.error('Save market analysis error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
