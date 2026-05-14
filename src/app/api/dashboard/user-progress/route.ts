import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

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

    // Run all queries in parallel
    const [
      user,
      moduleResults,
      diagnosisSessions,
      kiviatResults,
      riasecResults,
      activityLogs,
      moduleConfigs,
    ] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.moduleResult.findMany({
        where: { session: { userId } },
        include: { session: true },
        orderBy: { completedAt: 'asc' },
      }),
      db.diagnosisSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
      }),
      db.kiviatResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      db.riasecResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      db.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.moduleConfig.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Calculate days active
    const daysActive = Math.max(
      1,
      Math.ceil(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    )

    // Build modules array by combining moduleConfigs with user's moduleResults
    const completedModuleTypes = new Set(
      moduleResults.map((mr) => mr.moduleType)
    )
    const moduleScoreMap = new Map<string, { score: number; completedAt: string }>()
    for (const mr of moduleResults) {
      const existing = moduleScoreMap.get(mr.moduleType)
      // Keep the latest result per module type
      if (!existing || mr.completedAt > new Date(existing.completedAt)) {
        moduleScoreMap.set(mr.moduleType, {
          score: mr.score ?? 0,
          completedAt: mr.completedAt.toISOString(),
        })
      }
    }

    const modules = moduleConfigs.map((config) => {
      const result = moduleScoreMap.get(config.name)
      const isCompleted = completedModuleTypes.has(config.name)

      // Check if user has a session in progress for this module
      const inProgressSession = diagnosisSessions.find(
        (ds) =>
          ds.status === 'IN_PROGRESS' &&
          (ds.type.toString() === config.name ||
            config.name.toLowerCase().includes(ds.type.toString().toLowerCase()))
      )

      return {
        id: config.id,
        name: config.name,
        description: config.description,
        status: isCompleted
          ? 'completed'
          : inProgressSession
            ? 'in_progress'
            : 'not_started',
        score: result?.score ?? 0,
        completedAt: result?.completedAt ?? null,
      }
    })

    // KPIs
    const completedCount = modules.filter((m) => m.status === 'completed').length
    const totalModules = modules.length
    const completedScores = modules
      .filter((m) => m.status === 'completed')
      .map((m) => m.score)
    const averageScore =
      completedScores.length > 0
        ? completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length
        : 0

    // Generate badges from completed modules
    const badges = modules
      .filter((m) => m.status === 'completed' && m.score >= 70)
      .map((m) => `${m.name} complété`)

    // Add special badges
    if (completedCount === totalModules && totalModules > 0) {
      badges.push('Tous les modules complétés')
    }
    if (kiviatResults.length > 0) {
      badges.push('Profil Kiviat généré')
    }
    if (riasecResults.length > 0) {
      badges.push('Profil RIASEC établi')
    }

    // Evolution chart data - group module completions by month
    const monthlyCompletionMap = new Map<string, { month: string; modulesCompleted: number; totalScore: number; count: number }>()
    const monthNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
    ]

    for (const mr of moduleResults) {
      const date = new Date(mr.completedAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const existing = monthlyCompletionMap.get(key)

      if (existing) {
        existing.modulesCompleted++
        existing.totalScore += mr.score ?? 0
        existing.count++
      } else {
        monthlyCompletionMap.set(key, {
          month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
          modulesCompleted: 1,
          totalScore: mr.score ?? 0,
          count: 1,
        })
      }
    }

    // Get last 6 months of data
    const evolutionEntries = Array.from(monthlyCompletionMap.values())
    const evolution = evolutionEntries
      .sort((a, b) => {
        const monthA = monthNames.indexOf(a.month.split(' ')[0])
        const monthB = monthNames.indexOf(b.month.split(' ')[0])
        return monthA - monthB
      })
      .slice(-6)
      .map((entry) => ({
        month: entry.month,
        score: entry.count > 0 ? Math.round(entry.totalScore / entry.count) : 0,
        modulesCompleted: entry.modulesCompleted,
      }))

    // Fill in gaps if fewer than 6 months
    if (evolution.length < 6) {
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
        if (!evolution.find((e) => e.month === label)) {
          evolution.push({ month: label, score: 0, modulesCompleted: 0 })
        }
      }
      evolution.sort((a, b) => {
        const monthA = monthNames.indexOf(a.month.split(' ')[0])
        const monthB = monthNames.indexOf(b.month.split(' ')[0])
        return monthA - monthB
      })
    }

    // Determine next recommendation
    const nextModule = modules.find((m) => m.status === 'in_progress') ||
      modules.find((m) => m.status === 'not_started')

    const nextRecommendation = nextModule
      ? {
          moduleId: nextModule.id,
          title: `Poursuivez le module "${nextModule.name}"`,
          message: nextModule.status === 'in_progress'
            ? `Vous avez déjà commencé ce module. Continuez pour progresser.`
            : `Commencez le module "${nextModule.name}" pour avancer dans votre parcours.`,
        }
      : null

    return NextResponse.json(
      {
        userId: user.id,
        userInfo: {
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          daysActive,
        },
        kpis: {
          modulesCompleted: completedCount,
          totalModules,
          progressPercent: totalModules > 0 ? +((completedCount / totalModules) * 100).toFixed(1) : 0,
          averageScore: +averageScore.toFixed(1),
          badges,
        },
        modules,
        evolution,
        activityLogs: activityLogs.map((log) => ({
          id: log.id,
          action: log.action,
          details: log.details,
          createdAt: log.createdAt,
        })),
        nextRecommendation,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('User progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
