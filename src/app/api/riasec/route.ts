import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Retrieve user's RIASEC results
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const results = await db.riasecResult.findMany({
      where: { userId: payload!.userId },
      orderBy: { score: 'desc' },
    })

    const keywords = await db.keywordSelection.findMany({
      where: { userId: payload!.userId, selected: true },
    })

    return NextResponse.json({
      results: results.map((r) => ({
        type: r.profileType,
        score: r.score,
        isDominant: r.isDominant,
      })),
      keywords: keywords.map((k) => k.keyword),
    })
  } catch (err) {
    console.error('Get RIASEC results error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST: Save RIASEC results + keywords
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { results, keywords } = body

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Résultats RIASEC manquants' }, { status: 400 })
    }

    // Save RIASEC results
    for (const r of results) {
      await db.riasecResult.upsert({
        where: {
          userId_profileType: {
            userId: payload!.userId,
            profileType: r.type,
          },
        },
        create: {
          userId: payload!.userId,
          profileType: r.type,
          score: r.score,
          isDominant: r.isDominant || false,
        },
        update: {
          score: r.score,
          isDominant: r.isDominant || false,
        },
      })
    }

    // Save keywords
    if (keywords && Array.isArray(keywords)) {
      for (const kw of keywords) {
        await db.keywordSelection.upsert({
          where: {
            userId_keyword: {
              userId: payload!.userId,
              keyword: kw,
            },
          },
          create: {
            userId: payload!.userId,
            keyword: kw,
            selected: true,
          },
          update: {
            selected: true,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save RIASEC results error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
