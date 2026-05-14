import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Mapping from swipe skill IDs to Kiviat dimensions
// The 6 Kiviat dimensions for entrepreneurial profile
const KIVIAT_DIMENSIONS = [
  'Leadership & Vision',
  'Gestion du stress',
  'Communication',
  'Résolution de problèmes',
  'Créativité & Innovation',
  'Adaptabilité',
]

// Map swipe game skills to Kiviat dimensions (with weights)
// Each swipe skill contributes to one or more dimensions
const SKILL_TO_DIMENSION_MAP: Record<string, { dimension: string; weight: number }[]> = {
  leadership: [
    { dimension: 'Leadership & Vision', weight: 1.0 },
    { dimension: 'Adaptabilité', weight: 0.3 },
  ],
  stress: [
    { dimension: 'Gestion du stress', weight: 1.0 },
    { dimension: 'Adaptabilité', weight: 0.3 },
  ],
  communication: [
    { dimension: 'Communication', weight: 1.0 },
    { dimension: 'Leadership & Vision', weight: 0.3 },
  ],
  resolution: [
    { dimension: 'Résolution de problèmes', weight: 1.0 },
    { dimension: 'Adaptabilité', weight: 0.3 },
  ],
}

function computeKiviatFromSwipes(skills: { skillId: string; kept: boolean }[]) {
  // Initialize dimension scores
  const scores: Record<string, number> = {}
  const maxScores: Record<string, number> = {}
  for (const dim of KIVIAT_DIMENSIONS) {
    scores[dim] = 0
    maxScores[dim] = 0
  }

  // Calculate scores based on swipe results
  for (const skill of skills) {
    const mappings = SKILL_TO_DIMENSION_MAP[skill.skillId]
    if (!mappings) continue

    for (const mapping of mappings) {
      maxScores[mapping.dimension] += mapping.weight
      if (skill.kept) {
        scores[mapping.dimension] += mapping.weight
      }
    }
  }

  // Convert to 0-100 scale
  const dimensions = KIVIAT_DIMENSIONS.map((dim) => {
    const maxVal = maxScores[dim] || 1
    const rawScore = scores[dim] / maxVal
    // Scale: if all kept = 80-95 (not 100, leaves room for improvement)
    // If none kept = 15-30 (not 0, shows potential)
    const scaledValue = Math.round(20 + rawScore * 75)
    return {
      label: dim,
      value: Math.min(100, Math.max(5, scaledValue)),
    }
  })

  return dimensions
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET: Return swipe game results for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const results = await db.swipeGameResult.findMany({
      where: { userId },
      orderBy: { swipedAt: 'asc' },
    })

    return NextResponse.json(results, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching swipe game results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch swipe game results' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST: Save swipe game results AND auto-generate Kiviat scores
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, skills } = body

    if (!userId || !skills || !Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'userId and skills array are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Delete old swipe game results for this user
    await db.swipeGameResult.deleteMany({
      where: { userId },
    })

    // Create new swipe game results
    await db.swipeGameResult.createMany({
      data: skills.map(
        (s: { skillId: string; skillName: string; kept: boolean }) => ({
          userId,
          skillId: s.skillId,
          skillName: s.skillName,
          kept: s.kept,
        })
      ),
    })

    // === AUTO-GENERATE KIVIAT SCORES FROM SWIPE RESULTS ===
    const kiviatDimensions = computeKiviatFromSwipes(skills)

    // Delete old Kiviat results
    await db.kiviatResult.deleteMany({
      where: { userId },
    })

    // Save new Kiviat results
    await db.kiviatResult.createMany({
      data: kiviatDimensions.map((dim) => ({
        userId,
        dimension: dim.label,
        value: dim.value,
        maxValue: 100,
      })),
    })

    // Update CreatorSession swipe progress
    const kept = skills.filter((s: { kept: boolean }) => s.kept).length
    const passed = skills.length - kept
    await db.creatorSession.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: 3,
        swipeProgress: { kept, passed, total: skills.length },
        kiviatAspirations: kiviatDimensions,
      },
      update: {
        currentStep: 3,
        swipeProgress: { kept, passed, total: skills.length },
        kiviatAspirations: kiviatDimensions,
      },
    })

    // Fetch the created results to return them
    const savedResults = await db.swipeGameResult.findMany({
      where: { userId },
      orderBy: { swipedAt: 'asc' },
    })

    return NextResponse.json(
      {
        swipeResults: savedResults,
        kiviatGenerated: true,
        kiviatDimensions,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error saving swipe game results:', error)
    return NextResponse.json(
      { error: 'Failed to save swipe game results' },
      { status: 500, headers: corsHeaders }
    )
  }
}
