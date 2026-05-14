import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Get all notes for an interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const notes = await db.interviewNote.findMany({
      where: { interviewId: id },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (err) {
    console.error('Get notes error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST: Create a note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const body = await request.json()
    const { phase, category, content, isKeyPoint, isActionItem } = body

    if (!content) {
      return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    }

    const note = await db.interviewNote.create({
      data: {
        interviewId: id,
        phase: phase || 'PHASE_1_ACCUEIL',
        category: category || 'OBSERVATION',
        content,
        isKeyPoint: isKeyPoint || false,
        isActionItem: isActionItem || false,
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (err) {
    console.error('Create note error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
