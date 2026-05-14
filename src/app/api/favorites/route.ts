import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: List user's favorites (with actor details)
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const favorites = await db.favorite.findMany({
      where: { userId: payload!.userId },
      include: {
        actor: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Fetch favorites error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Add actor to favorites
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const { actorId } = body

    if (!actorId) {
      return NextResponse.json(
        { error: 'Le champ actorId est requis' },
        { status: 400 }
      )
    }

    const actorExists = await db.actor.findUnique({
      where: { id: actorId },
    })

    if (!actorExists) {
      return NextResponse.json(
        { error: 'Acteur introuvable' },
        { status: 404 }
      )
    }

    const existing = await db.favorite.findUnique({
      where: {
        userId_actorId: {
          userId: payload!.userId,
          actorId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Cet acteur est déjà dans vos favoris' },
        { status: 409 }
      )
    }

    const favorite = await db.favorite.create({
      data: {
        userId: payload!.userId,
        actorId,
      },
      include: {
        actor: true,
      },
    })

    return NextResponse.json({ favorite }, { status: 201 })
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Remove from favorites (query params: actorId)
export async function DELETE(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const actorId = searchParams.get('actorId')

    if (!actorId) {
      return NextResponse.json(
        { error: 'Le paramètre actorId est requis' },
        { status: 400 }
      )
    }

    const favorite = await db.favorite.findUnique({
      where: {
        userId_actorId: {
          userId: payload!.userId,
          actorId,
        },
      },
    })

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favori introuvable' },
        { status: 404 }
      )
    }

    await db.favorite.delete({
      where: {
        userId_actorId: {
          userId: payload!.userId,
          actorId,
        },
      },
    })

    return NextResponse.json({
      message: 'Favori supprimé avec succès',
      deletedFavoriteId: favorite.id,
    })
  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
