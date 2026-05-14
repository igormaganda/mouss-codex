import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

const ANTHROPIC_API_URL = 'https://api.z.ai/api/anthropic/v1/messages'
const ANTHROPIC_API_TOKEN = '427a8edd8e6947889f71f2283438c9dd.n20AT6nXD6hcB8RV'

interface Skill {
  name: string
  level: 'débutant' | 'intermédiaire' | 'avancé' | 'expert'
  priority: 'haute' | 'moyenne' | 'basse'
}

interface TrainingAction {
  skill: string
  action: string
  duration: string
  resource: string
}

// Predefined skill maps per role
const roleSkills: Record<string, { required: string[]; common: string[] }> = {
  entrepreneur: {
    required: ['Gestion financière', 'Marketing digital', 'Leadership', 'Planification stratégique', 'Négociation'],
    common: ['Communication', 'Gestion de projet', 'Analyse de données'],
  },
  dirigeant: {
    required: ['Direction générale', 'Finance corporate', 'RH & Management', 'Stratégie de croissance', 'Gouvernance'],
    common: ['Communication', 'Gestion de projet', 'Analyse de données'],
  },
  default: {
    required: ['Compétences techniques', 'Gestion de projet', 'Communication', 'Leadership'],
    common: ['Esprit d\'analyse', 'Adaptabilité', 'Travail en équipe'],
  },
}

async function analyzeWithAI(cvText: string, currentSkills: string[], targetRole: string): Promise<{
  acquiredSkills: Skill[]
  gapSkills: Skill[]
  recommendedPlan: TrainingAction[]
} | null> {
  try {
    const truncatedText = cvText.length > 4000 ? cvText.substring(0, 4000) : cvText

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_TOKEN,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Tu es un expert en accompagnement à la création d'entreprise. Analyse ce CV et ces compétences identifiées pour le rôle "${targetRole}".

CV extrait:
${truncatedText}

Compétences identifiées: ${JSON.stringify(currentSkills)}

Retourne un JSON avec cette structure exacte:
{
  "acquiredSkills": [{"name": "...", "level": "débutant|intermédiaire|avancé|expert", "priority": "haute|moyenne|basse"}],
  "gapSkills": [{"name": "...", "level": "débutant", "priority": "haute|moyenne|basse"}],
  "recommendedPlan": [{"skill": "...", "action": "...", "duration": "...", "resource": "..."}]
}

Retourne UNIQUEMENT le JSON valide, sans explication ni markdown.`,
          },
        ],
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('AI skill gap analysis error:', error)
    return null
  }
}

// POST: Run skill gap analysis and persist to DB
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  // Rate limit: 5 per 5 minutes
  const limiter = rateLimit(`skill-gap:${userId}`, { maxRequests: 5, windowMs: 300000 })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { cvText = '', currentSkills = [], targetRole = 'entrepreneur', sector = '' } = body

    // 1. Try AI-powered analysis first if we have CV text
    let aiResult: Awaited<ReturnType<typeof analyzeWithAI>> = null
    if (cvText && cvText.length > 50) {
      aiResult = await analyzeWithAI(cvText, currentSkills, targetRole)
    }

    // 2. Fallback to algorithmic analysis
    let acquiredSkills: Skill[]
    let gapSkills: Skill[]
    let recommendedPlan: TrainingAction[]

    if (aiResult) {
      acquiredSkills = aiResult.acquiredSkills
      gapSkills = aiResult.gapSkills
      recommendedPlan = aiResult.recommendedPlan
    } else {
      // Algorithmic fallback
      const roleMap = roleSkills[targetRole] || roleSkills.default
      const allRequired = [...roleMap.required, ...roleMap.common]

      acquiredSkills = allRequired
        .filter((required) =>
          currentSkills.some(
            (current) =>
              required.toLowerCase().includes(current.toLowerCase()) ||
              current.toLowerCase().includes(required.toLowerCase())
          )
        )
        .map((name) => ({
          name,
          level: 'intermédiaire' as const,
          priority: 'basse' as const,
        }))

      gapSkills = allRequired
        .filter(
          (required) =>
            !currentSkills.some(
              (current) =>
                required.toLowerCase().includes(current.toLowerCase()) ||
                current.toLowerCase().includes(required.toLowerCase())
            )
        )
        .map((name) => ({
          name,
          level: 'débutant' as const,
          priority: roleMap.required.includes(name) ? ('haute' as const) : ('moyenne' as const),
        }))

      recommendedPlan = gapSkills
        .sort((a, b) => (a.priority === 'haute' ? -1 : 1))
        .slice(0, 6)
        .map((skill) => ({
          skill: skill.name,
          action: `Formation certifiante en ${skill.name}`,
          duration: skill.priority === 'haute' ? '3-6 mois' : '1-3 mois',
          resource: sector ? `Ressource sectorielle: ${sector}` : 'Plateforme en ligne ou organisme de formation',
        }))
    }

    const allRequired = [...acquiredSkills, ...gapSkills]
    const coveragePercent = allRequired.length > 0
      ? +((acquiredSkills.length / allRequired.length) * 100).toFixed(1)
      : 0

    // 3. Persist to skill_gap_analyses table
    const analysis = await db.skillGapAnalysis.upsert({
      where: { id: `${userId}_latest` },
      create: {
        id: `${userId}_latest`,
        userId,
        cvFileName: undefined,
        cvFileUrl: undefined,
        acquiredSkills: acquiredSkills as unknown as any[],
        gapSkills: gapSkills as unknown as any[],
        recommendedPlan: recommendedPlan as unknown as any[],
        analyzedAt: new Date(),
      },
      update: {
        acquiredSkills: acquiredSkills as unknown as any[],
        gapSkills: gapSkills as unknown as any[],
        recommendedPlan: recommendedPlan as unknown as any[],
        analyzedAt: new Date(),
      },
    })

    const overallLevel =
      gapSkills.length === 0
        ? 'Profil complet'
        : gapSkills.filter((s) => s.priority === 'haute').length > 3
          ? 'Formation intensive requise'
          : 'Profil en cours de développement'

    return NextResponse.json({
      analysisId: analysis.id,
      targetRole,
      usedAI: !!aiResult,
      summary: {
        totalRequired: allRequired.length,
        acquired: acquiredSkills.length,
        gaps: gapSkills.length,
        coveragePercent,
      },
      acquiredSkills,
      gapSkills,
      recommendedPlan,
      overallLevel,
      analyzedAt: analysis.analyzedAt,
    })
  } catch (error) {
    console.error('Skill gap analysis error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// GET: Retrieve last skill gap analysis
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  try {
    const analysis = await db.skillGapAnalysis.findUnique({
      where: { id: `${userId}_latest` },
    })

    if (!analysis) {
      return NextResponse.json({ error: 'Aucune analyse de compétences trouvée' }, { status: 404 })
    }

    return NextResponse.json({
      analysisId: analysis.id,
      acquiredSkills: analysis.acquiredSkills,
      gapSkills: analysis.gapSkills,
      recommendedPlan: analysis.recommendedPlan,
      analyzedAt: analysis.analyzedAt,
    })
  } catch (error) {
    console.error('Get skill gap error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
