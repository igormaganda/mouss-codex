import { NextRequest, NextResponse } from 'next/server'

interface FeedbackPayload {
  rating: number
  module: string
  content: string
  isPrivate?: boolean
  authorId?: string
  author?: string
  authorRole?: string
}

// In-memory store for feedback items keyed by userId
const feedbackStore: Record<string, Array<{
  id: string
  module: string
  author: string
  authorRole: string
  content: string
  rating: number
  date: string
  isPrivate: boolean
}>> = {}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const feedback = feedbackStore[userId] || []
    return NextResponse.json({ userId, feedback })
  } catch (error) {
    console.error('Fetch feedback error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackPayload = await request.json()

    const { rating, module: moduleName, content, isPrivate = false, authorId, author, authorRole } = body

    // Validation - content is required, rating is optional
    if (!moduleName || moduleName.trim().length === 0) {
      return NextResponse.json({ error: 'Le module est requis.' }, { status: 400 })
    }
    if (!content || content.trim().length < 1) {
      return NextResponse.json({ error: 'Le contenu est requis.' }, { status: 400 })
    }

    // Simulate save
    const savedFeedback = {
      id: `fdb-${Date.now()}`,
      module: moduleName.trim(),
      author: author || 'Utilisateur',
      authorRole: authorRole || 'counselor',
      content: content.trim(),
      rating: rating || 0,
      date: new Date().toLocaleDateString('fr-FR'),
      isPrivate,
    }

    // Store in memory under the author's userId
    if (authorId) {
      if (!feedbackStore[authorId]) {
        feedbackStore[authorId] = []
      }
      feedbackStore[authorId].unshift(savedFeedback)
    }

    return NextResponse.json(
      {
        feedback: savedFeedback,
        message: 'Votre retour a été soumis avec succès.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Submit feedback error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
