import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const MODULE_TYPE = 'FINANCIER'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return financial data for a user (stored as ModuleResult with moduleType='FINANCIER')
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
    console.error('Error fetching financial data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Save financial data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, revenue, costs } = body

    if (!userId || revenue === undefined || costs === undefined) {
      return NextResponse.json(
        { error: 'userId, revenue, and costs are required' },
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

    const data = { revenue, costs }

    // Find existing ModuleResult for this session and module type
    const existing = await db.moduleResult.findFirst({
      where: {
        sessionId: session.id,
        moduleType: MODULE_TYPE,
      },
    })

    let result
    if (existing) {
      result = await db.moduleResult.update({
        where: { id: existing.id },
        data: {
          data,
          completedAt: new Date(),
        },
      })
    } else {
      result = await db.moduleResult.create({
        data: {
          sessionId: session.id,
          moduleType: MODULE_TYPE,
          data,
        },
      })
    }

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error saving financial data:', error)
    return NextResponse.json(
      { error: 'Failed to save financial data' },
      { status: 500, headers: corsHeaders }
    )
  }
}
