import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  // Rate limit: 30 per minute
  const limiter = rateLimit(`session-get:${userId}`, { maxRequests: 30, windowMs: 60000 })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limiter.resetTime - Date.now()) / 1000)) },
      }
    )
  }

  try {
    // Fetch or create CreatorSession
    let session = await db.creatorSession.findUnique({
      where: { userId },
      include: {
        cvUpload: true,
      },
    })

    if (!session) {
      session = await db.creatorSession.create({
        data: {
          userId,
          currentStep: 1,
          visionAnswers: {},
          swipeProgress: {},
          kiviatAcquis: [],
          kiviatAspirations: [],
          status: 'IN_PROGRESS',
        },
        include: {
          cvUpload: true,
        },
      })
    }

    const responseData: { session: typeof session; cvUpload?: typeof session.cvUpload } = {
      session,
    }

    if (session.cvUpload) {
      responseData.cvUpload = session.cvUpload
    }

    return NextResponse.json(responseData)
  } catch (err) {
    console.error('Get creator session error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  // Rate limit: 30 per minute
  const limiter = rateLimit(`session-post:${userId}`, { maxRequests: 30, windowMs: 60000 })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limiter.resetTime - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await request.json()
    const { currentStep, visionAnswers, swipeProgress } = body

    // Ensure session exists
    const existingSession = await db.creatorSession.findUnique({
      where: { userId },
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (currentStep !== undefined && typeof currentStep === 'number') {
      updateData.currentStep = currentStep
    }

    if (visionAnswers !== undefined && typeof visionAnswers === 'object') {
      // Merge with existing vision answers
      const mergedAnswers = {
        ...(existingSession.visionAnswers as Record<string, unknown> || {}),
        ...visionAnswers,
      }
      updateData.visionAnswers = mergedAnswers
    }

    if (swipeProgress !== undefined && typeof swipeProgress === 'object') {
      updateData.swipeProgress = swipeProgress
    }

    // Update session
    const updatedSession = await db.creatorSession.update({
      where: { userId },
      data: updateData,
    })

    return NextResponse.json({ session: updatedSession })
  } catch (err) {
    console.error('Update creator session error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
