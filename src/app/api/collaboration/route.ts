import { NextRequest, NextResponse } from 'next/server'

interface FeedbackItem {
  id: string
  module: string
  author: string
  content: string
  rating: number
  isPrivate: boolean
  createdAt: string
  replies?: { author: string; content: string; createdAt: string }[]
}

// In-memory mock store
const feedbackStore: FeedbackItem[] = [
  {
    id: 'fb-001',
    module: 'Diagnostic entrepreneurial',
    author: 'Marie Dupont',
    content: 'Très utile pour structurer mon projet. L\'analyse SWOT m\'a aidé à identifier mes points faibles.',
    rating: 5,
    isPrivate: false,
    createdAt: '2025-01-15T10:30:00Z',
    replies: [
      { author: 'Conseiller Martin', content: 'Merci pour votre retour, Marie ! N\'hésitez pas à revenir.', createdAt: '2025-01-16T09:00:00Z' },
    ],
  },
  {
    id: 'fb-002',
    module: 'Plan de financement',
    author: 'Jean Moreau',
    content: 'Les calculs d\'amortissement sont précis. Parfait pour préparer mon dossier bancaire.',
    rating: 4,
    isPrivate: false,
    createdAt: '2025-01-20T14:00:00Z',
  },
  {
    id: 'fb-003',
    module: 'Passage à l\'échelle',
    author: 'Amina Benali',
    content: 'J\'aurais aimé plus de scénarios personnalisés selon mon secteur d\'activité.',
    rating: 3,
    isPrivate: true,
    createdAt: '2025-02-01T11:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleFilter = searchParams.get('module')

    let results = feedbackStore.filter((f) => !f.isPrivate)
    if (moduleFilter) {
      results = results.filter((f) => f.module.toLowerCase().includes(moduleFilter.toLowerCase()))
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ feedback: results, total: results.length })
  } catch (error) {
    console.error('Fetch feedback error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { module: moduleName, author, content, rating, isPrivate } = body

    if (!moduleName || !content || !rating) {
      return NextResponse.json({ error: 'Champs requis: module, content, rating.' }, { status: 400 })
    }

    const newFeedback: FeedbackItem = {
      id: `fb-${String(feedbackStore.length + 1).padStart(3, '0')}`,
      module: moduleName,
      author: author || 'Anonyme',
      content,
      rating: Math.min(5, Math.max(1, rating)),
      isPrivate: !!isPrivate,
      createdAt: new Date().toISOString(),
    }

    feedbackStore.push(newFeedback)

    return NextResponse.json({ feedback: newFeedback, message: 'Retour enregistré avec succès.' }, { status: 201 })
  } catch (error) {
    console.error('Save feedback error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
