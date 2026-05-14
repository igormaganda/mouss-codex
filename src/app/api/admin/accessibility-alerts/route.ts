import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return all DisabilityRequest records with user name
export async function GET() {
  try {
    const requests = await db.disabilityRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = requests.map((req) => ({
      id: req.id,
      userName: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Inconnu',
      region: req.region,
      requestType: req.requestType,
      description: req.description,
      status: req.status,
      priority: req.priority,
      createdAt: req.createdAt,
      adminNotes: req.adminNotes,
      resolvedAt: req.resolvedAt,
    }))

    return NextResponse.json({ requests: formatted }, { headers: corsHeaders })
  } catch (error) {
    console.error('Fetch accessibility alerts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
