import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const forecast = await db.financialForecast.findFirst({
      where: { userId: payload!.userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!forecast) {
      return NextResponse.json({ forecast: null })
    }

    return NextResponse.json({ forecast })
  } catch (err) {
    console.error('Get financial forecast error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { revenue, expenses, growthRate, inflationRate, projection, sessionId } = body

    if (!revenue || !expenses) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const forecast = await db.financialForecast.create({
      data: {
        userId: payload!.userId,
        sessionId: sessionId || null,
        revenue,
        expenses,
        growthRate: parseFloat(growthRate) || 10.0,
        inflationRate: parseFloat(inflationRate) || 2.0,
        projection: projection || [],
      },
    })

    return NextResponse.json({ forecast }, { status: 201 })
  } catch (err) {
    console.error('Save financial forecast error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
