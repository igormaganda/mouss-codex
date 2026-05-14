import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `Tu es un expert en Business Model Canvas. Tu génères un BMC complet et structuré pour un projet entrepreneurial.
Tu dois remplir les 9 blocs du BMC avec des informations pertinentes, réalistes et spécifiques au projet.
Chaque bloc doit contenir 3-5 items concis et actionnables.
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "keyPartners": { "title": "Partenaires Clés", "items": ["item1", "item2", ...], "color": "#6366f1" },
  "keyActivities": { "title": "Activités Clés", "items": ["item1", "item2", ...], "color": "#8b5cf6" },
  "keyResources": { "title": "Ressources Clés", "items": ["item1", "item2", ...], "color": "#a855f7" },
  "valueProposition": { "title": "Proposition de Valeur", "items": ["item1", "item2", ...], "color": "#059669" },
  "customerRelationships": { "title": "Relations Clients", "items": ["item1", "item2", ...], "color": "#0d9488" },
  "channels": { "title": "Canaux", "items": ["item1", "item2", ...], "color": "#0891b2" },
  "customerSegments": { "title": "Segments Clients", "items": ["item1", "item2", ...], "color": "#0284c7" },
  "costStructure": { "title": "Structure de Coûts", "items": ["item1", "item2", ...], "color": "#dc2626" },
  "revenueStreams": { "title": "Flux de Revenus", "items": ["item1", "item2", ...], "color": "#ea580c" }
}
Les items doivent être en français, concis (5-15 mots chacun), et directement actionnables.`

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per minute
  const identifier = request.headers.get('authorization')?.replace('Bearer ', '') || request.headers.get('x-forwarded-for') || 'anonymous'
  const limiter = rateLimit(identifier, { maxRequests: 10, windowMs: 60000 })
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer dans un instant.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((limiter.resetTime - Date.now()) / 1000)) }
    })
  }

  const auth = authenticateRequest(request)
  if (!auth.authenticated) return auth.error!

  try {
    const { projectName, sector, description, targetMarket, currentStage } = await request.json()

    if (!projectName || !sector) {
      return NextResponse.json({ error: 'Nom du projet et secteur requis' }, { status: 400 })
    }

    const userPrompt = `Génère un Business Model Canvas pour le projet suivant :
- Nom : ${projectName}
- Secteur : ${sector}
- Description : ${description || 'Non renseignée'}
- Marché cible : ${targetMarket || 'Non renseigné'}
- Stade : ${currentStage || 'Idée'}

Contexte du porteur :
- Email : ${auth.payload!.email}
- Rôle : ${auth.payload!.role}

Génère les 9 blocs du BMC avec des informations spécifiques et réalistes.`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 })
    }

    const response = await fetch(`${process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-opus-4-6-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('BMC AI error:', error)
      // Fallback data
      return NextResponse.json(getFallbackBMC(projectName, sector))
    }

    const data = await response.json()
    const text = data.content?.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('') || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      } catch {
        // fallback
      }
    }

    return NextResponse.json(getFallbackBMC(projectName, sector))
  } catch (error) {
    console.error('BMC generation error:', error)
    return NextResponse.json(getFallbackBMC('Projet', 'Général'))
  }
}

function getFallbackBMC(project: string, sector: string) {
  return {
    keyPartners: { title: 'Partenaires Clés', items: [`Fournisseurs du secteur ${sector}`, 'Réseau BGE / CCI', 'Experts-comptables et avocats', 'Prescripteurs locaux'], color: '#6366f1' },
    keyActivities: { "title": "Activités Clés", items: ['Développement produit/service', 'Prospection et vente', 'Gestion administrative et financière', 'Veille concurrentielle et innovation'], color: '#8b5cf6' },
    keyResources: { "title": "Ressources Clés", items: ['Compétences techniques du porteur', 'Outils numériques et logiciel métier', 'Réseau professionnel', 'Capital de départ'], color: '#a855f7' },
    valueProposition: { "title": "Proposition de Valeur", items: [`${project} : une solution adaptée au marché ${sector}`, 'Approche personnalisée et de proximité', 'Rapport qualité-prix compétitif', 'Service client réactif'], color: '#059669' },
    customerRelationships: { "title": "Relations Clients", items: ['Relation directe et personnalisée', 'Accompagnement post-vente', 'Programme de fidélisation', 'Présence sur réseaux sociaux'], color: '#0d9488' },
    channels: { "title": "Canaux", items: ['Site web et e-commerce', 'Réseaux sociaux (LinkedIn, Instagram)', 'Bouche-à-oreille et recommandations', 'Événements et salons professionnels'], color: '#0891b2' },
    customerSegments: { "title": "Segments Clients", items: ['PME et TPE du secteur', 'Particuliers sensibles à la qualité', 'Collectivités locales', 'Professionnels en recherche defficacité'], color: '#0284c7' },
    costStructure: { "title": "Structure de Coûts", items: ['Charges fixes (local, assurances)', 'Coûts variables (matières, sous-traitance)', 'Marketing et communication', 'Frais de développement'], color: '#dc2626' },
    revenueStreams: { "title": "Flux de Revenus", items: ['Ventes directes de produits/services', 'Abonnements ou forfaits', 'Prestations de conseil', 'Revenus récurrents (contrats maintenance)'], color: '#ea580c' },
  }
}
