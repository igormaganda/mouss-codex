import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const MODULE_TYPE = 'MOTIVATIONS'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return motivations for a user (stored as ModuleResult with moduleType='MOTIVATIONS')
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

    const result = await db.moduleResult.findFirst({
      where: {
        session: { userId },
        moduleType: MODULE_TYPE,
      },
      orderBy: { completedAt: 'desc' },
    })

    if (!result) {
      return NextResponse.json(null, { headers: corsHeaders })
    }

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching motivations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch motivations' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Save motivations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, motivations } = body

    if (!userId || !motivations || typeof motivations !== 'object') {
      return NextResponse.json(
        { error: 'userId and motivations object are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find or create a DiagnosisSession for the user
    let session = await db.diagnosisSession.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    })

    if (!session) {
      session = await db.diagnosisSession.create({
        data: {
          userId,
          type: 'BILAN_DECOUVERTE',
          status: 'IN_PROGRESS',
        },
      })
    }

    // Find existing ModuleResult for this session and module type
    const existing = await db.moduleResult.findFirst({
      where: {
        sessionId: session.id,
        moduleType: MODULE_TYPE,
      },
    })

    let result
    if (existing) {
      // Update existing record
      result = await db.moduleResult.update({
        where: { id: existing.id },
        data: {
          data: motivations,
          completedAt: new Date(),
        },
      })
    } else {
      // Create new record
      result = await db.moduleResult.create({
        data: {
          sessionId: session.id,
          moduleType: MODULE_TYPE,
          data: motivations,
        },
      })
    }

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error saving motivations:', error)
    return NextResponse.json(
      { error: 'Failed to save motivations' },
      { status: 500, headers: corsHeaders }
    )
  }
}
