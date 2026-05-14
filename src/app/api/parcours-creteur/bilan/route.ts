import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

const ANTHROPIC_API_URL = 'https://api.z.ai/api/anthropic/v1/messages'
const ANTHROPIC_API_TOKEN = '427a8edd8e6947889f71f2283438c9dd.n20AT6nXD6hcB8RV'

interface BilanSection {
  title: string
  content: string
  type: string
}

interface BilanResult {
  sections: BilanSection[]
  viabilityScore: number
}

async function generateBilanWithAI(
  cvData: { fileName?: string; cvText?: string | null; parsedSkills?: unknown } | null,
  visionAnswers: Record<string, unknown> | null,
  swipeResults: Array<{ skillName: string; kept: boolean }> | null,
  kiviatAcquis: Array<{ label: string; value: number }> | null,
  kiviatAspirations: Array<{ label: string; value: number }> | null
): Promise<BilanResult> {
  try {
    const prompt = `Tu es un expert en création d'entreprise. Génère un bilan professionnel complet pour un porteur de projet en français.

DONNÉES DU PORTEUR DE PROJET:

1. CV:
${cvData ? `- Fichier: ${cvData.fileName || 'Non renseigné'}\n- Texte extrait: ${cvData.cvText || 'Non disponible'}\n- Compétences identifiées: ${JSON.stringify(cvData.parsedSkills || [])}` : 'Non fourni'}

2. Vision du projet:
${visionAnswers ? JSON.stringify(visionAnswers, null, 2) : 'Non renseignée'}

3. Compétences aspirées (jeu Radar):
${swipeResults && swipeResults.length > 0 ? `Compétences gardées: ${swipeResults.filter((s) => s.kept).map((s) => s.skillName).join(', ')}` : 'Non renseignées'}

4. Profil Kiviat acquis (CV):
${kiviatAcquis ? kiviatAcquis.map((d) => `${d.label}: ${d.value}/100`).join('\n') : 'Non disponible'}

5. Profil Kiviat aspirations (Radar):
${kiviatAspirations ? kiviatAspirations.map((d) => `${d.label}: ${d.value}/100`).join('\n') : 'Non disponible'}

Génère le bilan en JSON avec cette structure exacte:
{
  "sections": [
    {"title": "Analyse de profil", "content": "...", "type": "profile"},
    {"title": "Évaluation des compétences", "content": "...", "type": "skills"},
    {"title": "Analyse des écarts", "content": "...", "type": "gaps"},
    {"title": "Recommandations stratégiques", "content": "...", "type": "recommendations"},
    {"title": "Plan d'action prioritaire", "content": "...", "type": "action_plan"}
  ],
  "viabilityScore": 75
}

Le viabilityScore est un nombre entre 0 et 100 basé sur la cohérence globale du projet et du profil.
Chaque section doit contenir 3-5 paragraphes substantiels en français.
Ne renvoie que le JSON, rien d'autre.`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_TOKEN,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text())
      return {
        sections: [
          {
            title: 'Erreur de génération',
            content: 'Impossible de générer le bilan automatiquement. Veuillez réessayer plus tard.',
            type: 'error',
          },
        ],
        viabilityScore: 0,
      }
    }

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || '{}'

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        sections: parsed.sections || [],
        viabilityScore: Math.min(100, Math.max(0, Math.round(parsed.viabilityScore || 50))),
      }
    }

    return {
      sections: [
        {
          title: 'Erreur de parsing',
          content: 'Le format de réponse AI est invalide.',
          type: 'error',
        },
      ],
      viabilityScore: 0,
    }
  } catch (error) {
    console.error('AI bilan generation error:', error)
    return {
      sections: [
        {
          title: 'Erreur technique',
          content: 'Une erreur technique est survenue lors de la génération du bilan.',
          type: 'error',
        },
      ],
      viabilityScore: 0,
    }
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  // Rate limit: 5 per hour
  const limiter = rateLimit(`bilan:${userId}`, { maxRequests: 5, windowMs: 3600000 })
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
    // Fetch CreatorSession with all related data
    const session = await db.creatorSession.findUnique({
      where: { userId },
      include: {
        cvUpload: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Aucune session trouvée. Commencez le parcours créateur.' }, { status: 404 })
    }

    // Fetch swipe game results
    const swipeResults = await db.swipeGameResult.findMany({
      where: { userId },
      orderBy: { swipedAt: 'desc' },
    })

    // Prepare data for AI
    const cvData = session.cvUpload
      ? {
          fileName: session.cvUpload.fileName,
          cvText: session.cvUpload.cvText,
          parsedSkills: session.cvUpload.parsedSkills,
        }
      : null

    const visionAnswers = session.visionAnswers as Record<string, unknown> | null
    const kiviatAcquis = session.kiviatAcquis as Array<{ label: string; value: number }> | null
    const kiviatAspirations = session.kiviatAspirations as Array<{ label: string; value: number }> | null

    const swipeData = swipeResults.map((r) => ({
      skillName: r.skillName,
      kept: r.kept,
    }))

    // Generate bilan with AI
    const bilan = await generateBilanWithAI(cvData, visionAnswers, swipeData, kiviatAcquis, kiviatAspirations)

    // Store bilan data in the session
    const updatedSession = await db.creatorSession.update({
      where: { userId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      bilan,
      session: updatedSession,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Bilan generation error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
