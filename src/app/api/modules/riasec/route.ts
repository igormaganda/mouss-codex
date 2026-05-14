import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return RIASEC results for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const results = await db.riasecResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(results, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching RIASEC results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RIASEC results' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Save RIASEC results (delete old ones first)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, profiles } = body

    if (!userId || !profiles || !Array.isArray(profiles)) {
      return NextResponse.json(
        { error: 'userId and profiles array are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Delete old RIASEC results for this user
    await db.riasecResult.deleteMany({
      where: { userId },
    })

    // Create new RIASEC results
    await db.riasecResult.createMany({
      data: profiles.map(
        (p: { type: string; score: number; isDominant: boolean }) => ({
          userId,
          profileType: p.type,
          score: p.score,
          isDominant: p.isDominant,
        })
      ),
    })

    // Fetch the created results to return them
    const savedResults = await db.riasecResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(savedResults, { headers: corsHeaders })
  } catch (error) {
    console.error('Error saving RIASEC results:', error)
    return NextResponse.json(
      { error: 'Failed to save RIASEC results' },
      { status: 500, headers: corsHeaders }
    )
  }
}
