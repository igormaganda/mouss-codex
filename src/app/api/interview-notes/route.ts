import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Retrieve notes for an interview
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')

    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId requis' }, { status: 400 })
    }

    const notes = await db.interviewNote.findMany({
      where: { interviewId },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (err) {
    console.error('Get interview notes error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST: Create a note
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { interviewId, phase, category, content, isKeyPoint, isActionItem } = body

    if (!content) {
      return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    }

    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId requis' }, { status: 400 })
    }

    const note = await db.interviewNote.create({
      data: {
        interviewId,
        phase: phase || 'PHASE_1_ACCUEIL',
        category: category || 'OBSERVATION',
        content,
        isKeyPoint: isKeyPoint || false,
        isActionItem: isActionItem || false,
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (err) {
    console.error('Create interview note error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
