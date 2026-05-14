import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Retrieve user's Kiviat results
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const results = await db.kiviatResult.findMany({
      where: { userId: payload!.userId },
      orderBy: { createdAt: 'desc' },
    })

    const dimensions = results.map((r) => ({
      label: r.dimension,
      value: r.value,
      maxValue: r.maxValue,
    }))

    return NextResponse.json({ dimensions })
  } catch (err) {
    console.error('Get Kiviat results error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST: Save Kiviat results
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { dimensions } = body

    if (!dimensions || !Array.isArray(dimensions)) {
      return NextResponse.json({ error: 'Dimensions manquantes' }, { status: 400 })
    }

    // Delete existing results for this user before saving new ones
    await db.kiviatResult.deleteMany({
      where: { userId: payload!.userId },
    })

    // Save new results
    await db.kiviatResult.createMany({
      data: dimensions.map((d: { label: string; value: number; maxValue: number }) => ({
        userId: payload!.userId,
        dimension: d.label,
        value: d.value,
        maxValue: d.maxValue || 100,
      })),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save Kiviat results error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
