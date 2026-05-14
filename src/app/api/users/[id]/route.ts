import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      include: {
        diagnosisSessions: {
          include: {
            moduleResults: true,
          },
          orderBy: { startedAt: 'desc' },
        },
        kiviatResults: {
          orderBy: { createdAt: 'desc' },
        },
        riasecResults: {
          orderBy: { createdAt: 'desc' },
        },
        swipeGameResults: {
          orderBy: { swipedAt: 'desc' },
        },
        keywordSelections: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
        accessibilitySettings: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({ user }, { headers: corsHeaders })
  } catch (error) {
    console.error('Fetch user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
