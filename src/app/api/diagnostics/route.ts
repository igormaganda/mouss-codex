import { NextRequest, NextResponse } from 'next/server'

interface DiagnosticItem {
  id: string
  userId: string
  userName: string
  territory: string
  decision: 'go' | 'nogo' | 'pending'
  score: number
  modulesCompleted: string[]
  referral: string
  createdAt: string
  counselorId?: string
}

// Mock diagnostics data
const diagnostics: DiagnosticItem[] = [
  {
    id: 'diag-001',
    userId: 'usr-001',
    userName: 'Marie Dupont',
    territory: 'Île-de-France',
    decision: 'go',
    score: 8.2,
    modulesCompleted: ['Diagnostic', 'Analyse de marché', 'Plan de financement', 'Stratégie'],
    referral: 'BPI France',
    createdAt: '2025-01-25T10:00:00Z',
    counselorId: 'cns-01',
  },
  {
    id: 'diag-002',
    userId: 'usr-002',
    userName: 'Jean Moreau',
    territory: 'Auvergne-Rhône-Alpes',
    decision: 'go',
    score: 7.5,
    modulesCompleted: ['Diagnostic', 'Analyse de marché', 'Plan de financement'],
    referral: 'Chambre de Métiers',
    createdAt: '2025-02-02T14:30:00Z',
    counselorId: 'cns-02',
  },
  {
    id: 'diag-003',
    userId: 'usr-003',
    userName: 'Amina Benali',
    territory: 'Provence-Alpes-Côte d\'Azur',
    decision: 'nogo',
    score: 3.8,
    modulesCompleted: ['Diagnostic'],
    referral: 'Réseau Entreprendre',
    createdAt: '2025-02-10T09:15:00Z',
    counselorId: 'cns-01',
  },
  {
    id: 'diag-004',
    userId: 'usr-004',
    userName: 'Lucas Bernard',
    territory: 'Occitanie',
    decision: 'pending',
    score: 5.9,
    modulesCompleted: ['Diagnostic', 'Analyse de marché'],
    referral: '',
    createdAt: '2025-02-18T16:45:00Z',
  },
  {
    id: 'diag-005',
    userId: 'usr-005',
    userName: 'Fatima Zahra El Amrani',
    territory: 'Grand Est',
    decision: 'go',
    score: 9.1,
    modulesCompleted: ['Diagnostic', 'Analyse de marché', 'Plan de financement', 'Stratégie', 'Passage à l\'échelle'],
    referral: 'Initiative France',
    createdAt: '2025-02-22T11:00:00Z',
    counselorId: 'cns-03',
  },
  {
    id: 'diag-006',
    userId: 'usr-006',
    userName: 'Thomas Petit',
    territory: 'Pays de la Loire',
    decision: 'nogo',
    score: 2.5,
    modulesCompleted: ['Diagnostic'],
    referral: 'Formation entrepreneuriale recommandée',
    createdAt: '2025-03-01T08:30:00Z',
    counselorId: 'cns-02',
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const decision = searchParams.get('decision')
    const territory = searchParams.get('territory')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let results = [...diagnostics]

    if (decision) {
      results = results.filter((d) => d.decision === decision)
    }
    if (territory) {
      results = results.filter((d) => d.territory.toLowerCase().includes(territory.toLowerCase()))
    }

    // Sort by date descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Pagination
    const paginated = results.slice(offset, offset + limit)

    return NextResponse.json({
      diagnostics: paginated,
      total: results.length,
      limit,
      offset,
      stats: {
        totalDiags: diagnostics.length,
        goCount: diagnostics.filter((d) => d.decision === 'go').length,
        nogoCount: diagnostics.filter((d) => d.decision === 'nogo').length,
        pendingCount: diagnostics.filter((d) => d.decision === 'pending').length,
        averageScore: +(diagnostics.reduce((sum, d) => sum + d.score, 0) / diagnostics.length).toFixed(1),
      },
    })
  } catch (error) {
    console.error('Diagnostics fetch error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
