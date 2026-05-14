import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `Tu es un expert en création de Pitch Decks pour entrepreneurs. Tu génères un pitch deck professionnel de 10 slides.
Chaque slide doit être concise, percutante et contenir les informations clés pour convaincre des investisseurs ou partenaires.
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "slides": [
    { "id": 1, "title": "Titre du Projet", "subtitle": "Tagline accrocheuse en une phrase", "type": "title", "notes": "Notes présentateur pour slide 1" },
    { "id": 2, "title": "Le Problème", "points": ["point 1", "point 2", "point 3"], "stat": "statistique clé", "type": "problem", "notes": "Notes pour slide 2" },
    { "id": 3, "title": "Notre Solution", "points": ["point 1", "point 2", "point 3"], "highlight": "élément différenciant clé", "type": "solution", "notes": "Notes pour slide 3" },
    { "id": 4, "title": "Notre Marché", "tam": "X Mds EUR", "sam": "X M EUR", "som": "X K EUR", "growth": "X% par an", "type": "market", "notes": "Notes pour slide 4" },
    { "id": 5, "title": "Notre Produit", "features": ["feature 1", "feature 2", "feature 3", "feature 4"], "status": "Stade actuel", "type": "product", "notes": "Notes pour slide 5" },
    { "id": 6, "title": "Modèle Économique", "revenue": ["source 1", "source 2"], "pricing": "stratégie tarifaire", "unitEconomics": "marge / coût client", "type": "business-model", "notes": "Notes pour slide 6" },
    { "id": 7, "title": "Traction", "metrics": ["métrique 1", "métrique 2", "métrique 3"], "milestones": ["jalon 1", "jalon 2"], "type": "traction", "notes": "Notes pour slide 7" },
    { "id": 8, "title": "Avantage Concurrentiel", "advantages": ["avantage 1", "avantage 2", "avantage 3"], "moat": "fossé protecteur", "type": "competitive", "notes": "Notes pour slide 8" },
    { "id": 9, "title": "Notre Équipe", "members": [{"name": "Nom", "role": "Rôle", "background": "Expérience clé"}], "needs": "postes à pourvoir", "type": "team", "notes": "Notes pour slide 9" },
    { "id": 10, "title": "Demande d'Investissement", "amount": "Montant recherché", "use": ["affectation 1", "affectation 2", "affectation 3"], "roi": "retour sur investissement estimé", "type": "ask", "notes": "Notes pour slide 10" }
  ]
}
Tout le contenu doit être en français, professionnel et adapté au projet décrit.`

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
    const { projectName, sector, description, targetMarket, currentStage, teamSize } = await request.json()

    if (!projectName || !sector) {
      return NextResponse.json({ error: 'Nom du projet et secteur requis' }, { status: 400 })
    }

    const userPrompt = `Génère un Pitch Deck professionnel de 10 slides pour le projet :
- Nom : ${projectName}
- Secteur : ${sector}
- Description : ${description || 'Non renseignée'}
- Marché cible : ${targetMarket || 'Non renseigné'}
- Stade : ${currentStage || 'Idée'}
- Taille équipe : ${teamSize || '1 personne'}

Sois spécifique, utilise des données réalistes et des chiffres crédibles pour le secteur.`

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
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      console.error('Pitch Deck AI error:', await response.text())
      return NextResponse.json(getFallbackPitchDeck(projectName, sector))
    }

    const data = await response.json()
    const text = data.content?.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('') || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      } catch { /* fallback */ }
    }

    return NextResponse.json(getFallbackPitchDeck(projectName, sector))
  } catch (error) {
    console.error('Pitch Deck error:', error)
    return NextResponse.json(getFallbackPitchDeck('Projet', 'Général'))
  }
}

function getFallbackPitchDeck(project: string, sector: string) {
  return {
    slides: [
      { id: 1, title: project, subtitle: `Innover dans le secteur ${sector}`, type: 'title', notes: 'Présentez-vous et votre vision en 30 secondes' },
      { id: 2, title: 'Le Problème', points: [`${sector} : un marché en pleine mutation`, 'Les solutions actuelles ne répondent pas aux besoins', 'Les clients cherchent plus de personnalisation'], stat: '70% des acteurs du secteur expriment une insatisfaction', type: 'problem', notes: 'Appuyez-vous sur la douleur du client avec un exemple concret' },
      { id: 3, title: 'Notre Solution', points: [`${project} : une approche innovante et ciblée`, 'Technologie propriétaire adaptée au marché', 'Accompagnement personnalisé de A à Z'], highlight: 'Premier solution complète intégrée du marché', type: 'solution', notes: 'Démontrez votre solution avec un cas d\'usage concret' },
      { id: 4, title: 'Notre Marché', tam: '15 Md EUR', sam: '500 M EUR', som: '50 M EUR', growth: '12% par an', type: 'market', notes: 'Expliquez comment vous arrivez à ces chiffres' },
      { id: 5, title: 'Notre Produit', features: ['Fonctionnalité principale différenciante', 'Interface intuitive et accessible', 'Intégration avec les outils existants', 'Tableau de bord analytique'], status: 'Prototype validé - Lancement prévu', type: 'product', notes: 'Montrez des captures d\'écran ou maquettes si possible' },
      { id: 6, title: 'Modèle Économique', revenue: ['Abonnement mensuel (SaaS)', 'Prestations sur mesure', 'Commission sur transactions'], pricing: 'À partir de 99 EUR/mois', unitEconomics: 'CAC 150 EUR / LTV 900 EUR (ratio 6x)', type: 'business-model', notes: 'Expliquez votre pricing et la valeur perçue' },
      { id: 7, title: 'Traction', metrics: ['50 utilisateurs en phase beta', 'NPS de 72', '3 lettres d\'intention signées'], milestones: ['MVP livré', 'Premier client payant'], type: 'traction', notes: 'Mettez en avant les validations réelles du marché' },
      { id: 8, title: 'Avantage Concurrentiel', advantages: ['Expertise métier de 10+ ans', 'Réseau exclusif de partenaires', 'Technologie propriétaire brevetée'], moat: 'Données accumulées et effets de réseau', type: 'competitive', notes: 'Expliquez votre barrière à l\'entrée' },
      { id: 9, title: 'Notre Équipe', members: [{ name: 'Porteur de projet', role: 'CEO & Fondateur', background: `${sector} - 10 ans d\'expérience` }], needs: 'CTO technique, Chargé de commercialisation', type: 'team', notes: 'Mettez en avant la complémentarité des compétences' },
      { id: 10, title: 'Demande d\'Investissement', amount: '150 000 EUR', use: ['40% - Développement produit', '30% - Marketing et acquisition', '20% - Équipe', '10% - Frais opérationnels'], roi: 'Objectif : rentabilité en mois 18', type: 'ask', notes: 'Soyez précis sur l\'utilisation des fonds et les étapes clés' },
    ],
  }
}
