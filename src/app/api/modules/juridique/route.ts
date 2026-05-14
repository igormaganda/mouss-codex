import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const MODULE_TYPE = 'JURIDIQUE'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return juridique status for a user (stored as ModuleResult with moduleType='JURIDIQUE')
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
    console.error('Error fetching juridique data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch juridique data' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Save juridique choice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, selectedStatus } = body

    if (!userId || !selectedStatus) {
      return NextResponse.json(
        { error: 'userId and selectedStatus are required' },
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

    const data = { selectedStatus }

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
    console.error('Error saving juridique data:', error)
    return NextResponse.json(
      { error: 'Failed to save juridique data' },
      { status: 500, headers: corsHeaders }
    )
  }
}
