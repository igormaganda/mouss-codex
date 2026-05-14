import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'
import { callAI } from '@/lib/ai'

const SYSTEM_PROMPT = `Tu es l'IA Co-Pilote de Echo Entreprendre, un assistant intelligent intégré à une plateforme de diagnostic entrepreneurial. Tu aides les conseillers et les porteurs de projet dans leur parcours de création d'entreprise.

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

    // Call AI via z-ai-web-dev-sdk with GLM 4.7
    const response = await callAI(
      messages.slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' && m.content.length <= 5000
          ? m.content
          : String(m.content).slice(0, 5000),
      })),
      {
        systemPrompt: systemMessage,
        maxTokens: 4096,
        temperature: 0.7,
      }
    )

    return NextResponse.json({
      content: response,
      model: 'glm-4.7',
      usage: { model: 'glm-4.7', provider: 'z.ai' },
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
