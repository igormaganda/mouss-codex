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

// GET: Return notes (activity_logs with action='NOTE') for a user
export async function GET(request: NextRequest) {
  const { authenticated, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const notes = await db.activityLog.findMany({
      where: {
        userId,
        action: 'NOTE',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse the details JSON for each note
    const formattedNotes = notes.map((note) => {
      const details = note.details as Record<string, unknown>
      return {
        id: note.id,
        title: (details.title as string) || 'Sans titre',
        content: (details.content as string) || '',
        tag: (details.tag as string) || 'general',
        date: details.date as string || note.createdAt.toISOString(),
        counselorId: details.counselorId as string || null,
        createdAt: note.createdAt,
      }
    })

    return NextResponse.json({ notes: formattedNotes }, { headers: corsHeaders })
  } catch (error) {
    console.error('Fetch notes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Create a new note via activity_log
export async function POST(request: NextRequest) {
  const { authenticated, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { userId, counselorId, title, content, tag } = body

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'userId and title are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const note = await db.activityLog.create({
      data: {
        userId,
        action: 'NOTE',
        details: {
          title: title.trim(),
          content: content || '',
          tag: tag || 'general',
          counselorId: counselorId || null,
          date: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(
      {
        note: {
          id: note.id,
          title,
          content: content || '',
          tag: tag || 'general',
          counselorId: counselorId || null,
          createdAt: note.createdAt,
        },
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
