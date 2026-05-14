import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// POST: Toggle a reaction on a discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params
    const body = await request.json()
    const { emoji } = body

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json(
        { error: 'Un emoji de réaction est requis' },
        { status: 400 }
      )
    }

    const discussion = await db.discussion.findUnique({
      where: { id },
      select: { id: true, reactions: true },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion non trouvée' },
        { status: 404 }
      )
    }

    const currentReactions: Record<string, string[]> =
      (discussion.reactions as Record<string, string[]>) || {}
    const userId = payload!.userId

    // Initialize the emoji key if it doesn't exist
    if (!currentReactions[emoji]) {
      currentReactions[emoji] = []
    }

    const userIndex = currentReactions[emoji].indexOf(userId)
    let toggledAction: 'added' | 'removed'

    if (userIndex >= 0) {
      // User already reacted with this emoji — remove the reaction
      currentReactions[emoji].splice(userIndex, 1)
      if (currentReactions[emoji].length === 0) {
        delete currentReactions[emoji]
      }
      toggledAction = 'removed'
    } else {
      // Add the user's reaction
      currentReactions[emoji].push(userId)
      toggledAction = 'added'
    }

    const updatedDiscussion = await db.discussion.update({
      where: { id },
      data: { reactions: currentReactions },
      select: { id: true, reactions: true },
    })

    // Build a summary of reactions with counts for the response
    const reactionSummary = Object.entries(
      updatedDiscussion.reactions as Record<string, string[]>
    ).map(([key, users]) => ({
      emoji: key,
      count: users.length,
      hasReacted: users.includes(userId),
    }))

    return NextResponse.json({
      reactions: updatedDiscussion.reactions,
      reactionSummary,
      action: toggledAction,
    })
  } catch (error) {
    console.error('Toggle reaction error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
