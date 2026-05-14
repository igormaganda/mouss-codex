import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per minute
  const identifier = request.headers.get('authorization')?.replace('Bearer ', '') || request.headers.get('x-forwarded-for') || 'anonymous'
  const limiter = rateLimit(identifier, { maxRequests: 5, windowMs: 60000 })
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer dans un instant.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((limiter.resetTime - Date.now()) / 1000)) }
    })
  }

  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { sector, region, projectDescription, existingData } = body

    if (!sector) {
      return NextResponse.json({ error: 'Secteur requis' }, { status: 400 })
    }

    const regionStr = region ? `en ${region}` : 'en France'
    const prompt = `Tu es un expert en études de marché et analyse sectorielle. Réalise une analyse de marché approfondie pour un projet entrepreneurial.

Secteur: ${sector}
Région: ${regionStr}
Description du projet: ${projectDescription || 'Non renseignée'}
${existingData ? `Données existantes:\n${JSON.stringify(existingData, null, 2)}` : ''}

Fournis une analyse structurée en JSON:
{
  "marketSize": {"value": "X M€", "growth": "X%", "trend": "croissant/décroissant/stable"},
  "targetCustomers": ["Client cible 1", "Client cible 2", "Client cible 3"],
  "competitors": [
    {"name": "Nom", "strengths": ["Force 1"], "weaknesses": ["Faiblesse 1"], "marketShare": "X%"}
  ],
  "trends": [
    {"trend": "Description", "impact": "high/medium/low", "timeframe": "court/moyen/long terme"}
  ],
  "opportunities": ["Opportunité 1", "Opportunité 2", "Opportunité 3"],
  "threats": ["Menace 1", "Menace 2"],
  "keyIndicators": [
    {"name": "Indicateur", "value": "Valeur", "source": "Source"}
  ],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "confidenceScore": 70,
  "synthesis": "Synthèse de 4-5 phrases de l'analyse de marché"
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
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Market research AI error:', errText)
      return NextResponse.json({ error: 'Erreur IA' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')

    let analysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { synthesis: text, confidenceScore: 50 }
    } catch {
      analysis = { synthesis: text, confidenceScore: 50 }
    }

    return NextResponse.json({ analysis, usage: data.usage })
  } catch (err) {
    console.error('Market research error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
