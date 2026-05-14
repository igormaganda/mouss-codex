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

// GET: Return keyword selections for a user
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

    const results = await db.keywordSelection.findMany({
      where: { userId },
    })

    return NextResponse.json(results, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching keyword selections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch keyword selections' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Save keyword selections (delete old ones first)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, selections } = body

    if (!userId || !selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { error: 'userId and selections array are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Delete old keyword selections for this user
    await db.keywordSelection.deleteMany({
      where: { userId },
    })

    // Create new keyword selections
    await db.keywordSelection.createMany({
      data: selections.map(
        (s: { keyword: string; selected: boolean }) => ({
          userId,
          keyword: s.keyword,
          selected: s.selected,
        })
      ),
    })

    // Fetch the created results to return them
    const savedResults = await db.keywordSelection.findMany({
      where: { userId },
    })

    return NextResponse.json(savedResults, { headers: corsHeaders })
  } catch (error) {
    console.error('Error saving keyword selections:', error)
    return NextResponse.json(
      { error: 'Failed to save keyword selections' },
      { status: 500, headers: corsHeaders }
    )
  }
}
