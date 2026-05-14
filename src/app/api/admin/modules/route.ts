import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return all ModuleConfig records
export async function GET() {
  try {
    const modules = await db.moduleConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ modules }, { headers: corsHeaders })
  } catch (error) {
    console.error('Fetch modules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// PUT: Toggle module enabled status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, enabled } = body

    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'id (string) and enabled (boolean) are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify the module exists
    const existing = await db.moduleConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const updated = await db.moduleConfig.update({
      where: { id },
      data: { enabled },
    })

    return NextResponse.json(
      { module: updated },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Update module error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
