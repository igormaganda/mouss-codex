import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  auth?: {
    userId: string
    email: string
    role: string
  }
}

export function authenticateRequest(request: NextRequest): { authenticated: boolean; payload?: { userId: string; email: string; role: string }; error?: NextResponse } {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: NextResponse.json({ error: 'Token d\'authentification manquant' }, { status: 401 })
    }
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    return {
      authenticated: false,
      error: NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 })
    }
  }

  return { authenticated: true, payload }
}

export function requireRole(allowedRoles: string[]) {
  return (request: NextRequest): { authorized: boolean; error?: NextResponse } => {
    const { authenticated, payload, error } = authenticateRequest(request)

    if (!authenticated || error) {
      return { authorized: false, error }
    }

    if (!allowedRoles.includes(payload!.role)) {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Accès non autorisé pour ce rôle' }, { status: 403 })
      }
    }

    return { authorized: true }
  }
}
