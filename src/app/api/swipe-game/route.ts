import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// POST: Save a swipe game result
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { skillId, skillName, kept } = body

    if (!skillId || !skillName || typeof kept !== 'boolean') {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const result = await db.swipeGameResult.upsert({
      where: {
        userId_skillId: {
          userId: payload!.userId,
          skillId,
        },
      },
      create: {
        userId: payload!.userId,
        skillId,
        skillName,
        kept,
      },
      update: {
        skillName,
        kept,
      },
    })

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Save swipe game result error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// GET: Retrieve user's swipe game results
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const results = await db.swipeGameResult.findMany({
      where: { userId: payload!.userId },
      orderBy: { swipedAt: 'desc' },
    })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Get swipe game results error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
