import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return livrables for a counselor
export async function GET(request: NextRequest) {
  const { authenticated, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const counselorId = searchParams.get('counselorId')

    if (!counselorId) {
      return NextResponse.json(
        { error: 'counselorId parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const livrables = await db.livrable.findMany({
      where: { counselorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ livrables }, { headers: corsHeaders })
  } catch (error) {
    console.error('Fetch livrables error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Create a new livrable
export async function POST(request: NextRequest) {
  const { authenticated, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { counselorId, userId, type, title, content, status } = body

    if (!counselorId || !title) {
      return NextResponse.json(
        { error: 'counselorId and title are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate type if provided
    const validTypes = ['ACTION_PLAN', 'FINANCIAL_FORECAST', 'DIAGNOSIS_REPORT', 'CAREER_MAP', 'CERTIFICATE']
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate status if provided
    const validStatuses = ['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400, headers: corsHeaders }
      )
    }

    const livrable = await db.livrable.create({
      data: {
        counselorId,
        userId: userId || null,
        type: type || 'DIAGNOSIS_REPORT',
        title,
        content: content || {},
        status: status || 'DRAFT',
      },
    })

    return NextResponse.json(
      { livrable },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Create livrable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
