import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `Tu es un expert en planification stratégique et en méthodologie SMART. Tu génères une feuille de route sur 6 mois pour un projet entrepreneurial.
Chaque objectif doit suivre la méthode SMART : Spécifique, Mesurable, Atteignable, Pertinent, Temporel.
Chaque objectif doit avoir des jalons intermédiaires.
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "title": "Titre de la feuille de route",
  "projectName": "nom du projet",
  "objectives": [
    {
      "id": 1,
      "title": "Titre de l'objectif",
      "description": "Description détaillée",
      "smart": {
        "specific": "Ce qui est spécifique",
        "measurable": "Comment mesurer le succès",
        "achievable": "Pourquoi c'est atteignable",
        "relevant": "Pourquoi c'est pertinent pour le projet",
        "timeBound": "Délai précis"
      },
      "monthStart": 1,
      "monthEnd": 2,
      "milestones": [
        { "title": "Jalon 1", "target": "description cible", "completed": false },
        { "title": "Jalon 2", "target": "description cible", "completed": false }
      ],
      "priority": "high|medium|low"
    }
  ]
}
Génère 6-8 objectifs couvrant les 6 mois, répartis logiquement.
Les objectifs doivent couvrir : validation de marché, développement produit, stratégie commerciale, financement, structure juridique, et lancement.
Tout en français.`

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
    const { projectName, sector, description, currentStage } = await request.json()

    if (!projectName) {
      return NextResponse.json({ error: 'Nom du projet requis' }, { status: 400 })
    }

    const userPrompt = `Génère une feuille de route SMART sur 6 mois pour :
- Projet : ${projectName}
- Secteur : ${sector || 'Non renseigné'}
- Description : ${description || 'Non renseignée'}
- Stade actuel : ${currentStage || 'Idée'}

Génère 6-8 objectifs SMART avec jalons intermédiaires répartis sur les 6 mois.`

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
      console.error('SMART Roadmap AI error:', await response.text())
      return NextResponse.json(getFallbackRoadmap(projectName))
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

    return NextResponse.json(getFallbackRoadmap(projectName))
  } catch (error) {
    console.error('SMART Roadmap error:', error)
    return NextResponse.json(getFallbackRoadmap('Projet'))
  }
}

function getFallbackRoadmap(project: string) {
  return {
    title: `Feuille de Route SMART - ${project}`,
    projectName: project,
    objectives: [
      {
        id: 1, title: 'Valider le marché cible',
        description: 'Confirmer la demande réelle et affiner le segment client prioritaire',
        smart: { specific: `Réaliser 20 interviews clients pour ${project}`, measurable: '20 interviews complétées avec fiche de synthèse', achievable: '5 interviews par semaine sur 4 semaines', relevant: 'Évite de développer un produit sans marché', timeBound: 'Fin du Mois 1' },
        monthStart: 1, monthEnd: 1,
        milestones: [{ title: 'Préparer le guide d\'entretien', target: 'Guide validé par un conseiller', completed: false }, { title: 'Recueillir 20 retours', target: '20 fiches de synthèse complétées', completed: false }, { title: 'Synthèse et insights', target: 'Document de synthèse marché validé', completed: false }],
        priority: 'high',
      },
      {
        id: 2, title: 'Développer le MVP',
        description: 'Créer un produit minimum viable pour tester la proposition de valeur',
        smart: { specific: 'Lancer un MVP fonctionnel avec les 3 features core', measurable: '3 features livrées, 10 beta-testeurs actifs', achievable: 'Développement progressif en sprints hebdomadaires', relevant: 'Permet de tester le produit réel avec les utilisateurs', timeBound: 'Fin du Mois 3' },
        monthStart: 2, monthEnd: 3,
        milestones: [{ title: 'Définir les 3 features core', target: 'Cahier des charges MVP validé', completed: false }, { title: 'Développer le MVP', target: 'Produit déployé en environnement de test', completed: false }, { title: 'Recueillir les retours beta', target: '10 retours détaillés collectés', completed: false }],
        priority: 'high',
      },
      {
        id: 3, title: 'Construire la stratégie commerciale',
        description: 'Définir le plan d\'acquisition et les premiers canaux de vente',
        smart: { specific: 'Établir un plan commercial avec 3 canaux d\'acquisition prioritaires', measurable: '3 canaux actifs, 50 leads qualifiés', achievable: 'Canaux digitaux à faible coût initial', relevant: 'Génère les premières revenus rapidement', timeBound: 'Fin du Mois 4' },
        monthStart: 3, monthEnd: 4,
        milestones: [{ title: 'Définir l\'avatar client idéal', target: 'Persona documenté avec parcours d\'achat', completed: false }, { title: 'Créer les supports de vente', target: 'Pitch deck, brochure, site vitrine', completed: false }, { title: 'Activer les 3 canaux', target: 'Campagnes lancées sur chaque canal', completed: false }],
        priority: 'medium',
      },
      {
        id: 4, title: 'Sécuriser le financement',
        description: 'Obtenir les fonds nécessaires pour le lancement et les 12 premiers mois',
        smart: { specific: 'Monter un dossier de financement complet et le soumettre à 3 sources', measurable: '3 dossiers soumis, 1 accord de principe minimum', achievable: 'Dossier basé sur les données réelles collectées (Mois 1-3)', relevant: 'Assure la trésorerie pour les 12 premiers mois', timeBound: 'Fin du Mois 4' },
        monthStart: 3, monthEnd: 4,
        milestones: [{ title: 'Finaliser le business plan', target: 'Document complet avec prévisionnels', completed: false }, { title: 'Préparer les dossiers', target: '3 dossiers adaptés aux différents financeurs', completed: false }, { title: 'Soumettre et négocier', target: '3 dossiers déposés', completed: false }],
        priority: 'high',
      },
      {
        id: 5, title: 'Structurer juridiquement le projet',
        description: 'Choisir et mettre en place le statut juridique adapté',
        smart: { specific: 'Créer la structure juridique et obtenir les immatriculations nécessaires', measurable: 'SIRET obtenu, compte bancaire ouvert, assurances en place', achievable: 'Processus guidé par un expert-comptable', relevant: 'Condition légale pour exercer l\'activité', timeBound: 'Fin du Mois 2' },
        monthStart: 1, monthEnd: 2,
        milestones: [{ title: 'Choisir le statut juridique', target: 'Décision documentée avec simulateur', completed: false }, { title: 'Accompagnement expert-comptable', target: 'Lettre de mission signée', completed: false }, { title: 'Immatriculation', target: 'SIRET et KBIS obtenus', completed: false }],
        priority: 'medium',
      },
      {
        id: 6, title: 'Lancer officiellement l\'activité',
        description: 'Réaliser le lancement commercial avec les premiers clients',
        smart: { specific: 'Obtenir les 5 premiers clients payants et générer 5 000 EUR de CA', measurable: '5 clients signés, 5 000 EUR de chiffre d\'affaires', achievable: 'Basé sur le pipeline construit en Mois 3-4', relevant: 'Valide le modèle économique et lance la croissance', timeBound: 'Fin du Mois 6' },
        monthStart: 5, monthEnd: 6,
        milestones: [{ title: 'Finaliser l\'offre commerciale', target: 'Tarifs et contrats validés', completed: false }, { title: 'Lancer la campagne de lancement', target: 'Événement/communication de lancement réalisé', completed: false }, { title: 'Signer les 5 premiers clients', target: '5 contrats signés et facturés', completed: false }],
        priority: 'high',
      },
    ],
  }
}
