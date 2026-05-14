import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

// Kiviat dimension mapping for Radar skills
const KIVIAT_DIMENSIONS = [
  { key: 'leadership', label: 'Leadership & Management', code: 'R' },
  { key: 'innovation', label: 'Innovation & Créativité', code: 'I' },
  { key: 'communication', label: 'Communication & Relationnel', code: 'A' },
  { key: 'resolution', label: 'Résolution & Analytique', code: 'S' },
  { key: 'organisation', label: 'Organisation & Planification', code: 'C' },
  { key: 'adaptabilite', label: 'Adaptabilité & Résilience', code: 'E' },
] as const

// Keyword-based skill-to-dimension mapping
const SKILL_DIMENSION_KEYWORDS: Record<string, string[]> = {
  leadership: [
    'leader', 'management', 'gestion', 'direction', 'encadrement', 'équipe', 'equipe',
    'coordination', 'supervision', 'responsable', 'pilote', 'animer', 'déléguer',
    'manager', 'motivation', 'coach', 'mentoring', 'RH', 'ressources humaines',
  ],
  innovation: [
    'innovation', 'créatif', 'creatif', 'créativité', 'creativite', 'design',
    'conception', 'R&D', 'recherche', 'prototype', 'idées', 'idees', 'imaginatif',
    'artistique', 'UX', 'UI', 'digital', 'technologie', 'IA', 'intelligence artificielle',
  ],
  communication: [
    'communication', 'relationnel', 'négociation', 'negociation', 'présentation',
    'presentation', 'rédaction', 'redaction', 'public', 'client', 'service',
    'vente', 'commercial', 'marketing', 'réseaux sociaux', 'media', 'conférence',
  ],
  resolution: [
    'analytique', 'analyse', 'résolution', 'resolution', 'problème', 'probleme',
    'données', 'donnees', 'data', 'statistique', 'audit', 'diagnostic', 'expert',
    'technique', 'stratégie', 'strategie', 'optimisation', 'méthodologie',
  ],
  organisation: [
    'organisation', 'planification', 'planning', 'projet', 'gestion de projet',
    'project management', 'agile', 'scrum', 'kanban', 'budget', 'finance',
    'comptabilité', 'logistique', 'administratif', 'processus', 'qualité',
  ],
  adaptabilite: [
    'adaptabilité', 'adaptabilite', 'résilience', 'resilience', 'flexible',
    'polyvalent', 'multitâche', 'multitache', 'autonome', 'apprentissage',
    'formation', 'évolution', 'evolution', 'changement', 'urgence', 'stress',
    'international', 'langues',
  ],
}

function mapSkillToDimension(skillName: string): string {
  const lower = skillName.toLowerCase()

  let bestMatch = 'adaptabilite'
  let bestScore = 0

  for (const [dimension, keywords] of Object.entries(SKILL_DIMENSION_KEYWORDS)) {
    let score = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score++
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = dimension
    }
  }

  return bestMatch
}

function calculateKiviatDimensions(keptSkills: string[]): Array<{ label: string; value: number; maxValue: number }> {
  const counts: Record<string, number> = {}
  for (const dim of KIVIAT_DIMENSIONS) {
    counts[dim.key] = 0
  }

  for (const skill of keptSkills) {
    const dimension = mapSkillToDimension(skill)
    counts[dimension] = (counts[dimension] || 0) + 1
  }

  const maxCount = Math.max(...Object.values(counts), 1)

  return KIVIAT_DIMENSIONS.map((dim) => ({
    label: dim.label,
    value: Math.round((counts[dim.key] / maxCount) * 100),
    maxValue: 100,
  }))
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  // Rate limit: 60 per minute (frequent swipes)
  const limiter = rateLimit(`radar-post:${userId}`, { maxRequests: 60, windowMs: 60000 })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limiter.resetTime - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await request.json()
    const { skillId, kept } = body as { skillId?: string; kept?: boolean }

    if (!skillId || typeof kept !== 'boolean') {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Save swipe to SwipeGameResult using upsert
    const swipeResult = await db.swipeGameResult.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
      create: {
        userId,
        skillId,
        skillName: skillId, // Will be the skill name from the swipe card
        kept,
      },
      update: {
        kept,
      },
    })

    // Fetch ALL kept skills for this user
    const allResults = await db.swipeGameResult.findMany({
      where: { userId, kept: true },
    })

    const keptSkillNames = allResults.map((r) => r.skillName)
    const totalKept = keptSkillNames.length

    // Calculate Kiviat dimensions
    const dimensions = calculateKiviatDimensions(keptSkillNames)

    // Get total swiped count
    const totalSwiped = await db.swipeGameResult.count({
      where: { userId },
    })

    // Calculate swipe progress
    const swipeProgress = {
      kept: totalKept,
      passed: totalSwiped - totalKept,
      total: totalSwiped,
    }

    // Update CreatorSession with kiviatAspirations and swipeProgress
    await db.creatorSession.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: 3,
        swipeProgress,
        kiviatAspirations: dimensions,
        status: 'IN_PROGRESS',
      },
      update: {
        swipeProgress,
        kiviatAspirations: dimensions,
      },
    })

    return NextResponse.json({
      kept: swipeResult.kept,
      total: totalSwiped,
      dimensions,
      swipeProgress,
    })
  } catch (err) {
    console.error('Radar swipe error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  try {
    // Fetch all swipe results for user
    const results = await db.swipeGameResult.findMany({
      where: { userId },
      orderBy: { swipedAt: 'desc' },
    })

    // Fetch CreatorSession for kiviatAspirations
    const session = await db.creatorSession.findUnique({
      where: { userId },
    })

    const keptCount = results.filter((r) => r.kept).length
    const passedCount = results.filter((r) => !r.kept).length
    const progress = {
      kept: keptCount,
      passed: passedCount,
      total: results.length,
    }

    const dimensions = (session?.kiviatAspirations as Array<{ label: string; value: number; maxValue: number }>) || []

    return NextResponse.json({
      results,
      progress,
      dimensions,
    })
  } catch (err) {
    console.error('Get radar results error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
