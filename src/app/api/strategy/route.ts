import { NextRequest, NextResponse } from 'next/server'

interface StrategyRequest {
  growthLevers: {
    innovation: number
    marketing: number
    digitalPresence: number
    partnerships: number
    talentRetention: number
  }
  financialParams: {
    annualRevenue: number
    annualCosts: number
    growthRate: number
    availableCapital: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StrategyRequest = await request.json()
    const { growthLevers, financialParams } = body

    const leverWeights = { innovation: 0.3, marketing: 0.25, digitalPresence: 0.2, partnerships: 0.15, talentRetention: 0.1 }
    const strategyScore = Object.entries(growthLevers).reduce(
      (sum, [key, val]) => sum + val * leverWeights[key as keyof typeof leverWeights],
      0
    )

    const profitability = financialParams.annualRevenue - financialParams.annualCosts
    const profitMargin = financialParams.annualRevenue > 0
      ? (profitability / financialParams.annualRevenue) * 100
      : 0
    const projectedRevenue = financialParams.annualRevenue * (1 + financialParams.growthRate / 100)
    const capitalRatio = financialParams.availableCapital / financialParams.annualCosts

    const swot = {
      strengths: [
        'Équipe fondatrice expérimentée',
        'Produit innovant avec avantage concurrentiel',
        'Base clients fidèle et croissante',
      ].filter(() => strategyScore > 40),
      weaknesses: [
        'Dépendance à un petit nombre de clients',
        'Processus internes à optimiser',
        'Visibilité limitée sur certains marchés',
      ].filter(() => strategyScore < 70),
      opportunities: [
        'Expansion régionale en cours de développement',
        'Partenariats stratégiques potentiels',
        'Demande croissante du marché',
      ].filter(() => growthLevers.digitalPresence > 5),
      threats: [
        'Concurrence accrue sur le segment',
        'Réglementation en évolution',
        'Ressources humaines sous pression',
      ].filter(() => growthLevers.talentRetention < 7),
    }

    return NextResponse.json({
      strategyScore: +strategyScore.toFixed(1),
      maxScore: 100,
      level:
        strategyScore >= 75 ? 'Excellente' : strategyScore >= 50 ? 'Bonne' : strategyScore >= 30 ? 'Moyenne' : 'À améliorer',
      swot,
      profitability: {
        annualProfit: profitability,
        profitMargin: +profitMargin.toFixed(1),
        projectedRevenue: +projectedRevenue.toFixed(0),
        growthRate: financialParams.growthRate,
      },
      recommendations: [
        strategyScore < 50 && 'Renforcez votre stratégie d\'innovation et de marketing.',
        growthLevers.digitalPresence < 6 && 'Investissez dans votre transformation numérique.',
        capitalRatio < 0.3 && 'Diversifiez vos sources de financement.',
        profitMargin < 10 && 'Optimisez la structure de coûts pour améliorer la rentabilité.',
      ].filter(Boolean),
    })
  } catch (error) {
    console.error('Strategy analysis error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
