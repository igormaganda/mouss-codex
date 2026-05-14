import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'
const MODEL = process.env.AI_MODEL || 'claude-opus-4-6-20250514'

const SYSTEM_PROMPT = `Tu es l'IA Co-Pilote de CréaScope, un assistant intelligent intégré à une plateforme de diagnostic entrepreneurial. Tu aides les conseillers et les porteurs de projet dans leur parcours de création d'entreprise.

Tu dois :
- Analyser les profils entrepreneuriaux (RIASEC, compétences, Kiviat)
- Fournir des recommandations personnalisées et actionnables
- Identifier les forces et les axes d'amélioration
- Suggérer des formations et des ressources adaptées
- Répondre en français avec un ton professionnel et bienveillant
- Formatter tes réponses de manière claire avec des listes quand approprié`

export async function POST(request: NextRequest) {
  // Rate limiting: 20 requests per minute
  const identifier = request.headers.get('authorization')?.replace('Bearer ', '') || request.headers.get('x-forwarded-for') || 'anonymous'
  const limiter = rateLimit(identifier, { maxRequests: 20, windowMs: 60000 })
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer dans un instant.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((limiter.resetTime - Date.now()) / 1000)) }
    })
  }

  // Authentication required for AI chat
  const auth = authenticateRequest(request)
  if (!auth.authenticated || !auth.payload) {
    return auth.error!
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY environment variable is not set')
    return NextResponse.json(
      { error: 'Service IA non configuré' },
      { status: 503 }
    )
  }

  try {
    const { messages, context } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages valides requis' },
        { status: 400 }
      )
    }

    // Build system message with context
    let systemMessage = SYSTEM_PROMPT
    if (context) {
      const safeName = typeof context.userName === 'string' && context.userName.length <= 100
        ? context.userName
        : 'Non renseigné'
      const safeRole = typeof context.userRole === 'string' && context.userRole.length <= 50
        ? context.userRole
        : 'Utilisateur'

      systemMessage += `\n\nContexte utilisateur:\n- Nom: ${safeName}\n- Rôle: ${safeRole}`

      if (context.diagnosticData) {
        // Limit diagnostic data size to prevent token abuse
        const dataStr = JSON.stringify(context.diagnosticData)
        if (dataStr.length <= 10000) {
          systemMessage += `\n\nDonnées de diagnostic:\n${dataStr}`
        }
      }
    }

    // Call Anthropic API
    const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemMessage,
        messages: messages.slice(-20).map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: typeof m.content === 'string' && m.content.length <= 5000
            ? m.content
            : String(m.content).slice(0, 5000),
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      return NextResponse.json(
        { error: "Erreur lors de la communication avec l'IA" },
        { status: 502 }
      )
    }

    const data = await response.json()

    // Extract text from response
    const text = data.content
      ?.filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('') || 'Pas de réponse'

    return NextResponse.json({
      content: text,
      model: MODEL,
      usage: data.usage,
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
