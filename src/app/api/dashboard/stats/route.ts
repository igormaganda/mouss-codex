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
    // Current year boundaries for monthly data
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear + 1, 0, 1)

    // Month labels in French
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]

    // Run all queries in parallel for performance
    const [
      totalUsers,
      usersByRole,
      diagnosticsByStatus,
      diagnosticsByDecision,
      counselorsCount,
      territories,
      recentActivityLogs,
      monthlyDiagnosisSessions,
      recentDiagnosticsWithUser,
      completedDiagnostics,
    ] = await Promise.all([
      // Total users count
      db.user.count(),

      // Users grouped by role
      db.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Diagnostics grouped by status
      db.diagnosisSession.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Diagnostics grouped by Go/No-Go decision
      db.diagnosisSession.groupBy({
        by: ['goNoGoDecision'],
        _count: true,
        where: { goNoGoDecision: { not: null } },
      }),

      // Counselors count
      db.counselor.count(),

      // Territories with their stats
      db.territory.findMany({
        orderBy: { name: 'asc' },
      }),

      // Recent activity logs (last 20)
      db.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),

      // Diagnosis sessions for the current year (for monthly grouping)
      db.diagnosisSession.findMany({
        where: {
          startedAt: {
            gte: yearStart,
            lt: yearEnd,
          },
        },
        select: {
          startedAt: true,
        },
      }),

      // Latest 10 diagnosis sessions with user info and counselor region
      db.diagnosisSession.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      // Completed diagnostics for KPI calculations
      db.diagnosisSession.findMany({
        where: { status: 'COMPLETED' },
        select: {
          score: true,
          durationMinutes: true,
        },
      }),
    ])

    // Format users by role into a readable object
    const usersByRoleFormatted = usersByRole.reduce(
      (acc, item) => {
        acc[item.role] = item._count.role
        return acc
      },
      {} as Record<string, number>
    )

    // Format diagnostics by status
    const diagnosticsByStatusFormatted = diagnosticsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status
        return acc
      },
      {} as Record<string, number>
    )

    // Format diagnostics by decision
    const diagnosticsByDecisionFormatted = diagnosticsByDecision.reduce(
      (acc, item) => {
        if (item.goNoGoDecision) {
          acc[item.goNoGoDecision] = item._count
        }
        return acc
      },
      {} as Record<string, number>
    )

    // --- Build monthlyData ---
    const monthlyCounts = new Array(12).fill(0)
    for (const session of monthlyDiagnosisSessions) {
      const monthIndex = session.startedAt.getMonth()
      monthlyCounts[monthIndex]++
    }
    const monthlyData = monthNames.map((month, index) => ({
      month,
      count: monthlyCounts[index],
    }))

    // --- Build recentDiagnostics with region from counselor assignment ---
    // Fetch counselor assignments for the users in recent diagnostics
    const recentUserIds = recentDiagnosticsWithUser.map((d) => d.userId)
    const counselorAssignments = recentUserIds.length > 0
      ? await db.counselorAssignment.findMany({
          where: { userId: { in: recentUserIds }, status: 'ACTIVE' },
          include: {
            counselor: {
              select: { territory: true },
            },
          },
        })
      : []

    const userRegionMap = new Map<string, string>()
    for (const assignment of counselorAssignments) {
      if (assignment.counselor.territory) {
        userRegionMap.set(assignment.userId, assignment.counselor.territory)
      }
    }

    const recentDiagnostics = recentDiagnosticsWithUser.map((d) => {
      const userName = d.user.name ||
        `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim() || 'Inconnu'
      return {
        id: d.id,
        userName,
        region: userRegionMap.get(d.userId) || null,
        date: d.startedAt,
        goNoGoDecision: d.goNoGoDecision,
        score: d.score,
      }
    })

    // --- Build KPIs for IndicateursTab ---
    const completedCount = completedDiagnostics.length
    const scores = completedDiagnostics
      .map((d) => d.score)
      .filter((s): s is number => s !== null)
    const averageScore = scores.length > 0
      ? +(scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)
      : 0
    const durations = completedDiagnostics
      .map((d) => d.durationMinutes)
      .filter((d): d is number => d !== null)
    const averageDuration = durations.length > 0
      ? +(durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(1)
      : 0

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          usersByRole: usersByRoleFormatted,
          diagnosticsByStatus: diagnosticsByStatusFormatted,
          diagnosticsByDecision: diagnosticsByDecisionFormatted,
          counselorsCount,
          territories,
          recentActivityLogs,
        },
        monthlyData,
        recentDiagnostics,
        kpis: {
          completedCount,
          averageScore,
          averageDuration,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Fetch dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
