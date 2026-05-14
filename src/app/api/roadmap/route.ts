import { NextRequest, NextResponse } from 'next/server'

interface RoadmapStep {
  id: string
  order: number
  title: string
  description: string
  status: 'completed' | 'in_progress' | 'upcoming' | 'blocked'
  moduleId?: string
  estimatedDuration: string
  completedAt?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'usr-001'

    // Mock roadmap steps for a user journey
    const steps: RoadmapStep[] = [
      {
        id: 'step-1',
        order: 1,
        title: 'Inscription et profil entrepreneurial',
        description: 'Créer votre compte et compléter votre profil RIASEC.',
        status: 'completed',
        moduleId: 'mod-profile',
        estimatedDuration: '30 min',
        completedAt: '2025-01-10',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Diagnostic entrepreneurial',
        description: 'Évaluer la viabilité de votre projet avec l\'outil de diagnostic.',
        status: 'completed',
        moduleId: 'mod-1',
        estimatedDuration: '2h',
        completedAt: '2025-01-20',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Analyse de marché',
        description: 'Étudier votre marché cible, la concurrence et les tendances.',
        status: 'completed',
        moduleId: 'mod-2',
        estimatedDuration: '3h',
        completedAt: '2025-02-05',
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Plan de financement',
        description: 'Élaborer votre plan de financement et explorer les sources disponibles.',
        status: 'completed',
        moduleId: 'mod-3',
        estimatedDuration: '2h 30',
        completedAt: '2025-02-18',
      },
      {
        id: 'step-5',
        order: 5,
        title: 'Simulation de passage à l\'échelle',
        description: 'Modéliser différents scénarios de croissance pour votre entreprise.',
        status: 'in_progress',
        moduleId: 'mod-4',
        estimatedDuration: '2h',
      },
      {
        id: 'step-6',
        order: 6,
        title: 'Stratégie de croissance',
        description: 'Définir vos leviers de croissance et votre positionnement.',
        status: 'upcoming',
        moduleId: 'mod-5',
        estimatedDuration: '3h',
      },
      {
        id: 'step-7',
        order: 7,
        title: 'Simulation Go/No-Go',
        description: 'Prendre une décision éclairée sur le lancement de votre projet.',
        status: 'upcoming',
        moduleId: 'mod-6',
        estimatedDuration: '1h 30',
      },
      {
        id: 'step-8',
        order: 8,
        title: 'Entretien avec un conseiller',
        description: 'Rencontrez un conseiller pour valider votre parcours et obtenir un accompagnement personnalisé.',
        status: 'upcoming',
        estimatedDuration: '1h',
      },
    ]

    const completed = steps.filter((s) => s.status === 'completed').length
    const currentStep = steps.find((s) => s.status === 'in_progress')

    return NextResponse.json({
      userId,
      steps,
      progress: {
        completed,
        total: steps.length,
        percent: +((completed / steps.length) * 100).toFixed(1),
        currentStepId: currentStep?.id || null,
      },
    })
  } catch (error) {
    console.error('Roadmap fetch error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
