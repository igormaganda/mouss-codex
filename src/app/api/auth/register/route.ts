import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { validateRegisterInput } from '@/lib/validation'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'https://creapulse.vercel.app']

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) })
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)

  try {
    const body = await request.json()
    const { email, password, name } = body

    // Full input validation
    const validation = validateRegisterInput(name, email, password)
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0]
      return NextResponse.json(
        { error: firstError },
        { status: 400, headers: corsHeaders }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409, headers: corsHeaders }
      )
    }

    const passwordHash = hashPassword(password)

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'USER',
        isActive: true,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500, headers: corsHeaders }
    )
  }
}
