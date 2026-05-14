import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

interface PathStep {
  id: string
  title: string
  description: string
  type: string
  status: string
  order: number
  resources?: string[]
  estimatedDuration?: string
  completedAt?: string | null
}

// GET: Get user's personalized path (with AI-generated steps if none exists)
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const userId = payload!.userId

    let path = await db.personalizedPath.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // If no path exists, generate one using AI
    if (!path) {
      const generatedSteps = await generatePersonalizedSteps(userId)
      const overallProgress = 0

      path = await db.personalizedPath.create({
        data: {
          userId,
          steps: generatedSteps as any,
          progress: overallProgress,
        },
      })
    }

    const steps: PathStep[] = Array.isArray(path.steps) ? (path.steps as unknown as PathStep[]) : []

    const completedSteps = steps.filter(
      (s) => s.status === 'completed'
    ).length

    const currentProgress =
      steps.length > 0
        ? Math.round((completedSteps / steps.length) * 100)
        : 0

    // Update progress if it changed
    if (currentProgress !== path.progress) {
      path = await db.personalizedPath.update({
        where: { id: path.id },
        data: { progress: currentProgress },
      })
    }

    return NextResponse.json({
      path: {
        ...path,
        steps,
        completedSteps,
        totalSteps: steps.length,
        computedProgress: currentProgress,
      },
    })
  } catch (error) {
    console.error('Fetch personalized path error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Create or update path progress
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { stepId, status, steps, regenerate } = body
    const userId = payload!.userId

    // Regenerate the entire path
    if (regenerate) {
      const generatedSteps = await generatePersonalizedSteps(userId)

      // Delete existing path and create new one
      await db.personalizedPath.deleteMany({ where: { userId } })
      const path = await db.personalizedPath.create({
        data: {
          userId,
          steps: generatedSteps as any,
          progress: 0,
        },
      })

      return NextResponse.json({
        path: {
          ...path,
          steps: generatedSteps,
          completedSteps: 0,
          totalSteps: generatedSteps.length,
          computedProgress: 0,
        },
      })
    }

    // Replace entire steps array
    if (Array.isArray(steps)) {
      let path = await db.personalizedPath.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      if (path) {
        path = await db.personalizedPath.update({
          where: { id: path.id },
          data: { steps: steps as any },
        })
      } else {
        path = await db.personalizedPath.create({
          data: { userId, steps: steps as any, progress: 0 },
        })
      }

      const completedCount = steps.filter(
        (s: PathStep) => s.status === 'completed'
      ).length
      const newProgress =
        steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

      if (newProgress !== path.progress) {
        path = await db.personalizedPath.update({
          where: { id: path.id },
          data: { progress: newProgress },
        })
      }

      return NextResponse.json({
        path: {
          ...path,
          steps,
          completedSteps: completedCount,
          totalSteps: steps.length,
          computedProgress: newProgress,
        },
      })
    }

    // Update a single step's status
    if (stepId && status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'skipped']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }

      let path = await db.personalizedPath.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      if (!path) {
        return NextResponse.json(
          { error: 'Aucun parcours personnalisé trouvé' },
          { status: 404 }
        )
      }

      const currentSteps: PathStep[] = Array.isArray(path.steps) ? (path.steps as unknown as PathStep[]) : []
      const stepIndex = currentSteps.findIndex((s) => s.id === stepId)

      if (stepIndex === -1) {
        return NextResponse.json(
          { error: 'Étape non trouvée dans le parcours' },
          { status: 404 }
        )
      }

      currentSteps[stepIndex] = {
        ...currentSteps[stepIndex],
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      }

      const completedCount = currentSteps.filter(
        (s) => s.status === 'completed'
      ).length
      const newProgress =
        currentSteps.length > 0
          ? Math.round((completedCount / currentSteps.length) * 100)
          : 0

      path = await db.personalizedPath.update({
        where: { id: path.id },
        data: {
          steps: currentSteps as any,
          progress: newProgress,
        },
      })

      return NextResponse.json({
        path: {
          ...path,
          steps: currentSteps,
          completedSteps: completedCount,
          totalSteps: currentSteps.length,
          computedProgress: newProgress,
        },
      })
    }

    return NextResponse.json(
      { error: 'Paramètres invalides. Fournissez stepId+status, steps, ou regenerate: true' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Update personalized path error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Generate personalized steps based on the user's data using the AI SDK
async function generatePersonalizedSteps(userId: string): Promise<PathStep[]> {
  const defaultSteps: PathStep[] = [
    {
      id: 'step-1',
      title: 'Bilan de compétences initial',
      description:
        'Passez le bilan de compétences pour identifier vos forces et axes d\'amélioration.',
      type: 'assessment',
      status: 'pending',
      order: 1,
      resources: [
        'Module RIASEC',
        'Kiviat Radar',
        'Swipe Game des compétences',
      ],
      estimatedDuration: '45 min',
      completedAt: null,
    },
    {
      id: 'step-2',
      title: 'Analyse du marché cible',
      description:
        'Explorez votre marché cible et identifiez les opportunités de création d\'entreprise.',
      type: 'research',
      status: 'pending',
      order: 2,
      resources: ['Analyse de marché IA', 'Veille sectorielle'],
      estimatedDuration: '30 min',
      completedAt: null,
    },
    {
      id: 'step-3',
      title: 'Simulation juridique',
      description:
        'Déterminez le statut juridique optimal pour votre activité.',
      type: 'simulation',
      status: 'pending',
      order: 3,
      resources: ['Simulateur juridique', 'Guide des statuts'],
      estimatedDuration: '20 min',
      completedAt: null,
    },
    {
      id: 'step-4',
      title: 'Prévisions financières',
      description:
        'Élaborez vos prévisions financières et estimez vos besoins de financement.',
      type: 'finance',
      status: 'pending',
      order: 4,
      resources: ['Simulateur financier', 'Modèles de prévisions'],
      estimatedDuration: '40 min',
      completedAt: null,
    },
    {
      id: 'step-5',
      title: 'Entretien avec un conseiller',
      description:
        'Planifiez et passez un entretien approfondi avec votre conseiller dédié.',
      type: 'interview',
      status: 'pending',
      order: 5,
      resources: ['Préparation à l\'entretien', 'Checklist documents'],
      estimatedDuration: '60 min',
      completedAt: null,
    },
    {
      id: 'step-6',
      title: 'Trouver un mentor',
      description:
        'Connectez-vous avec un mentor expérimenté pour vous accompagner dans votre projet.',
      type: 'mentoring',
      status: 'pending',
      order: 6,
      resources: ['Annuaire des mentors', 'Guide du mentorat'],
      estimatedDuration: '15 min',
      completedAt: null,
    },
    {
      id: 'step-7',
      title: 'Finaliser le plan d\'action',
      description:
        'Consolidez tous les résultats en un plan d\'action concret et réalisable.',
      type: 'plan',
      status: 'pending',
      order: 7,
      resources: [
        'Générateur de plan d\'action IA',
        'Modèle business plan',
      ],
      estimatedDuration: '30 min',
      completedAt: null,
    },
  ]

  try {
    // Fetch user data to personalize the path
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        diagnosisSessions: {
          take: 1,
          orderBy: { startedAt: 'desc' },
          include: { moduleResults: true },
        },
        riasecResults: { orderBy: { createdAt: 'desc' }, take: 6 },
        swipeGameResults: { where: { kept: true } },
        kiviatResults: { orderBy: { createdAt: 'desc' }, take: 6 },
        marketAnalyses: { take: 1, orderBy: { createdAt: 'desc' } },
        juridiqueAnalyses: { take: 1, orderBy: { createdAt: 'desc' } },
        financialForecasts: { take: 1, orderBy: { createdAt: 'desc' } },
        motivationAssessments: { take: 1, orderBy: { createdAt: 'desc' } },
        skillGapAnalyses: { take: 1, orderBy: { analyzedAt: 'desc' } },
      },
    })

    if (!user) {
      return defaultSteps
    }

    // Check if the user has completed certain steps
    const hasDiagnosis = user.diagnosisSessions.some(
      (s) => s.status === 'COMPLETED'
    )
    const hasRiasec = user.riasecResults.length > 0
    const hasKiviat = user.kiviatResults.length > 0
    const hasMarketAnalysis = user.marketAnalyses.length > 0
    const hasJuridique = user.juridiqueAnalyses.length > 0
    const hasFinancial = user.financialForecasts.length > 0
    const hasMotivation = user.motivationAssessments.length > 0

    // Update step statuses based on completed work
    const personalizedSteps = defaultSteps.map((step) => {
      const updated = { ...step }

      switch (step.id) {
        case 'step-1':
          if (hasDiagnosis || hasRiasec || hasKiviat) {
            updated.status = 'completed'
            updated.completedAt = new Date().toISOString()
          }
          break
        case 'step-2':
          if (hasMarketAnalysis) {
            updated.status = 'completed'
            updated.completedAt = new Date().toISOString()
          }
          break
        case 'step-3':
          if (hasJuridique) {
            updated.status = 'completed'
            updated.completedAt = new Date().toISOString()
          }
          break
        case 'step-4':
          if (hasFinancial) {
            updated.status = 'completed'
            updated.completedAt = new Date().toISOString()
          }
          break
        case 'step-5':
          if (hasMotivation) {
            updated.status = 'in_progress'
          }
          break
      }

      return updated
    })

    // If first pending step exists and previous ones are done, mark it as in_progress
    const firstPendingIdx = personalizedSteps.findIndex(
      (s) => s.status === 'pending'
    )
    if (
      firstPendingIdx > 0 &&
      personalizedSteps[firstPendingIdx - 1].status === 'completed'
    ) {
      personalizedSteps[firstPendingIdx].status = 'in_progress'
    } else if (firstPendingIdx === 0) {
      personalizedSteps[0].status = 'in_progress'
    }

    return personalizedSteps
  } catch (err) {
    console.error('Error generating personalized steps:', err)
    return defaultSteps
  }
}
