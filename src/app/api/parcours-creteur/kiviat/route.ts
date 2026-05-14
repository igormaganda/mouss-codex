import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

interface KiviatDimension {
  label: string
  value: number
  maxValue: number
}

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  try {
    const session = await db.creatorSession.findUnique({
      where: { userId },
    })

    if (!session) {
      // Return empty dimensions if no session
      const emptyDimensions: KiviatDimension[] = [
        { label: 'Leadership & Management', value: 0, maxValue: 100 },
        { label: 'Innovation & Créativité', value: 0, maxValue: 100 },
        { label: 'Communication & Relationnel', value: 0, maxValue: 100 },
        { label: 'Résolution & Analytique', value: 0, maxValue: 100 },
        { label: 'Organisation & Planification', value: 0, maxValue: 100 },
        { label: 'Adaptabilité & Résilience', value: 0, maxValue: 100 },
      ]

      return NextResponse.json({
        acquis: emptyDimensions,
        aspirations: emptyDimensions,
      })
    }

    const acquis = (session.kiviatAcquis as unknown as KiviatDimension[]) || [
      { label: 'Leadership & Management', value: 0, maxValue: 100 },
      { label: 'Innovation & Créativité', value: 0, maxValue: 100 },
      { label: 'Communication & Relationnel', value: 0, maxValue: 100 },
      { label: 'Résolution & Analytique', value: 0, maxValue: 100 },
      { label: 'Organisation & Planification', value: 0, maxValue: 100 },
      { label: 'Adaptabilité & Résilience', value: 0, maxValue: 100 },
    ]

    const aspirations = (session.kiviatAspirations as unknown as KiviatDimension[]) || [
      { label: 'Leadership & Management', value: 0, maxValue: 100 },
      { label: 'Innovation & Créativité', value: 0, maxValue: 100 },
      { label: 'Communication & Relationnel', value: 0, maxValue: 100 },
      { label: 'Résolution & Analytique', value: 0, maxValue: 100 },
      { label: 'Organisation & Planification', value: 0, maxValue: 100 },
      { label: 'Adaptabilité & Résilience', value: 0, maxValue: 100 },
    ]

    return NextResponse.json({
      acquis,
      aspirations,
    })
  } catch (err) {
    console.error('Get kiviat error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  try {
    const body = await request.json()
    const { dimensions, source } = body as {
      dimensions?: KiviatDimension[]
      source?: 'acquis' | 'aspirations'
    }

    if (!dimensions || !Array.isArray(dimensions)) {
      return NextResponse.json({ error: 'Dimensions manquantes' }, { status: 400 })
    }

    if (!source || (source !== 'acquis' && source !== 'aspirations')) {
      return NextResponse.json(
        { error: 'Source invalide. Utilisez "acquis" ou "aspirations".' },
        { status: 400 }
      )
    }

    // Validate dimension structure
    const isValidDimensions = dimensions.every(
      (d) =>
        typeof d.label === 'string' &&
        typeof d.value === 'number' &&
        typeof d.maxValue === 'number'
    )

    if (!isValidDimensions) {
      return NextResponse.json({ error: 'Format de dimensions invalide' }, { status: 400 })
    }

    // Update CreatorSession
    const updateData: Record<string, unknown> = {}
    if (source === 'acquis') {
      updateData.kiviatAcquis = dimensions
    } else {
      updateData.kiviatAspirations = dimensions
    }

    const session = await db.creatorSession.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: 1,
        ...updateData,
        status: 'IN_PROGRESS',
      },
      update: updateData,
    })

    return NextResponse.json({
      source,
      dimensions,
      session,
    })
  } catch (err) {
    console.error('Update kiviat error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
