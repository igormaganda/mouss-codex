import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const user = await db.user.findUnique({
      where: { id: payload!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        accessibilitySettings: true,
        _count: {
          select: {
            diagnosisSessions: true,
            notifications: { where: { isRead: false } },
            swipeGameResults: true,
            riasecResults: true,
            kiviatResults: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Get latest diagnosis
    const latestDiagnosis = await db.diagnosisSession.findFirst({
      where: { userId: payload!.userId },
      orderBy: { startedAt: 'desc' },
    })

    // Get Kiviat results
    const kiviatResults = await db.kiviatResult.findMany({
      where: { userId: payload!.userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })

    // Get RIASEC results
    const riasecResults = await db.riasecResult.findMany({
      where: { userId: payload!.userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })

    return NextResponse.json({
      user,
      latestDiagnosis,
      kiviatResults,
      riasecResults,
    })
  } catch (error) {
    console.error('Fetch profile error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
