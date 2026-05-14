import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const body = await request.json()
    const { phase, notes } = body

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json({ error: 'Notes requises pour la synthèse' }, { status: 400 })
    }

    const phaseLabels: Record<string, string> = {
      PHASE_1_ACCUEIL: 'Phase 1 - Accueil & Profil',
      PHASE_2_DIAGNOSTIC: 'Phase 2 - Diagnostic',
      PHASE_3_SYNTHESE: 'Phase 3 - Synthèse',
    }

    const prompt = `Tu es un expert en diagnostic entrepreneurial BGE. Résume les notes de ${phaseLabels[phase] || 'cette phase'} d'un entretien de création d'entreprise.

Notes brutes:
${notes.map((n: any) => `[${n.category}] ${n.content}`).join('\n')}

Fournis en JSON:
{
  "summary": "Résumé structuré de 3-5 phrases",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "risks": ["Risque 1", "Risque 2"],
  "nextSteps": ["Étape suivante 1", "Étape suivante 2"],
  "confidence": 75
}

Réponds UNIQUEMENT en JSON valide, sans markdown.`

    const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI summarize error:', errText)
      return NextResponse.json({ error: 'Erreur IA' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')

    // Parse the JSON response
    let analysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, keyInsights: [], recommendations: [], risks: [], nextSteps: [], confidence: 50 }
    } catch {
      analysis = { summary: text, keyInsights: [], recommendations: [], risks: [], nextSteps: [], confidence: 50 }
    }

    // Update notes with AI summary
    // Note: aiSummary and aiRecommendation fields removed - schema update needed
    // to persist AI analysis results
    if (notes.length > 0) {
      // await db.interviewNote.update({
      //   where: { id: notes[0].id },
      //   data: {},
      // })
    }

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Summarize error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
