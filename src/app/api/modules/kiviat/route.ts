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

// GET: Return kiviat results for a user
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

    const results = await db.kiviatResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(results, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching kiviat results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kiviat results' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Save kiviat results (delete old ones first)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, dimensions } = body

    if (!userId || !dimensions || !Array.isArray(dimensions)) {
      return NextResponse.json(
        { error: 'userId and dimensions array are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Delete old kiviat results for this user
    await db.kiviatResult.deleteMany({
      where: { userId },
    })

    // Create new kiviat results
    const results = await db.kiviatResult.createMany({
      data: dimensions.map(
        (dim: { label: string; value: number }) => ({
          userId,
          dimension: dim.label,
          value: dim.value,
          maxValue: 100,
        })
      ),
    })

    // Fetch the created results to return them
    const savedResults = await db.kiviatResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(savedResults, { headers: corsHeaders })
  } catch (error) {
    console.error('Error saving kiviat results:', error)
    return NextResponse.json(
      { error: 'Failed to save kiviat results' },
      { status: 500, headers: corsHeaders }
    )
  }
}
