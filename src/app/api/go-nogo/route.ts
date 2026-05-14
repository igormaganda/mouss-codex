import { NextRequest, NextResponse } from 'next/server'

interface CriterionScore {
  id: string
  label: string
  score: number // 0-10
  weight: number // 0-1
}

interface GoNoGoRequest {
  sessionId: string
  criteria: CriterionScore[]
  decision: 'go' | 'nogo' | 'pending'
  comments?: string
}

// In-memory store for evaluations keyed by userId
const evaluations: Record<string, {
  criteria: CriterionScore[]
  decision: 'GO' | 'NO_GO' | null
  reason: string
  savedAt: string
}> = {}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const evaluation = evaluations[userId] || null
    return NextResponse.json({ userId, evaluation })
  } catch (error) {
    console.error('Go/No-Go fetch error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GoNoGoRequest = await request.json()
    const { sessionId, criteria, decision, comments } = body

    if (!sessionId || !criteria || !decision) {
      return NextResponse.json({ error: 'Champs requis: sessionId, criteria, decision.' }, { status: 400 })
    }

    // Calculate weighted score
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
    const weightedScore = totalWeight > 0
      ? criteria.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight
      : 0

    const normalizedScore = +weightedScore.toFixed(1)
    const maxScore = 10

    // Determine recommendation
    const autoRecommendation =
      normalizedScore >= 7 ? 'go' : normalizedScore >= 4 ? 'conditional' : 'nogo'

    // Decision summary
    const summary = {
      sessionId,
      decision,
      weightedScore: normalizedScore,
      maxScore,
      autoRecommendation,
      matches: decision === autoRecommendation || (autoRecommendation === 'conditional'),
      criteriaCount: criteria.length,
      strongCriteria: criteria.filter((c) => c.score >= 7).map((c) => c.label),
      weakCriteria: criteria.filter((c) => c.score <= 4).map((c) => c.label),
    }

    return NextResponse.json({
      decision: summary,
      message:
        decision === 'go'
          ? 'Décision GO enregistrée. Votre projet est jugé viable et prêt à passer à la phase suivante.'
          : decision === 'nogo'
            ? 'Décision NO-GO enregistrée. Le projet nécessite des ajustements importants avant de continuer.'
            : 'Décision en attente. Complétez l\'évaluation pour finaliser.',
      nextSteps:
        decision === 'go'
          ? ['Finaliser le business plan', 'Rechercher des financements', 'Prendre rendez-vous avec un conseiller']
          : decision === 'nogo'
            ? ['Revoir le modèle économique', 'Approfondir l\'analyse de marché', 'Consulter un mentor']
            : ['Compléter les critères manquants', 'Consulter les ressources pédagogiques'],
      comments,
    }, { status: 201 })
  } catch (error) {
    console.error('Go/No-Go decision error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
