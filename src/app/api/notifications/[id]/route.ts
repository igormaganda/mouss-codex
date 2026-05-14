import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification || notification.userId !== payload!.userId) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 })
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json({ notification: updated })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
