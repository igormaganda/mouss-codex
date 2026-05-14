import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'

const ADMIN_SECRET = process.env.ADMIN_SEED_SECRET || 'dev-secret-change-in-production'

const testUsers = [
  // Porteurs de projet
  {
    email: 'porteur1@example.com',
    password: 'test123',
    name: 'Jean Porteur',
    firstName: 'Jean',
    lastName: 'Porteur',
    role: 'USER',
  },
  {
    email: 'porteur2@example.com',
    password: 'test123',
    name: 'Sophie Créatrice',
    firstName: 'Sophie',
    lastName: 'Créatrice',
    role: 'USER',
  },
  // Conseillers
  {
    email: 'conseiller1@example.com',
    password: 'test123',
    name: 'Pierre Conseiller',
    firstName: 'Pierre',
    lastName: 'Conseiller',
    role: 'COUNSELOR',
  },
  {
    email: 'conseiller2@example.com',
    password: 'test123',
    name: 'Claire Accompagnatrice',
    firstName: 'Claire',
    lastName: 'Accompagnatrice',
    role: 'COUNSELOR',
  },
  // Admins
  {
    email: 'admin1@example.com',
    password: 'test123',
    name: 'Marc Admin',
    firstName: 'Marc',
    lastName: 'Admin',
    role: 'ADMIN',
  },
  {
    email: 'admin2@example.com',
    password: 'test123',
    name: 'Isabelle SuperAdmin',
    firstName: 'Isabelle',
    lastName: 'SuperAdmin',
    role: 'ADMIN',
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret } = body

    // Vérification du secret admin
    if (secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const results: Array<{ email: string; status: string; error?: string }> = []

    for (const user of testUsers) {
      try {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
        })

        if (existingUser) {
          const passwordHash = await bcrypt.hash(user.password, 10)
          await db.user.update({
            where: { email: user.email },
            data: { passwordHash },
          })
          results.push({ email: user.email, status: 'updated' })
        } else {
          const passwordHash = await bcrypt.hash(user.password, 10)
          await db.user.create({
            data: {
              email: user.email,
              passwordHash,
              name: user.name,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role as any,
              isActive: true,
            },
          })
          results.push({ email: user.email, status: 'created' })
        }
      } catch (error) {
        results.push({ email: user.email, status: 'error', error: String(error) })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateurs de test créés avec succès',
      users: results,
      credentials: {
        porteurs: [
          { email: 'porteur1@example.com', password: 'test123' },
          { email: 'porteur2@example.com', password: 'test123' },
        ],
        conseillers: [
          { email: 'conseiller1@example.com', password: 'test123' },
          { email: 'conseiller2@example.com', password: 'test123' },
        ],
        admins: [
          { email: 'admin1@example.com', password: 'test123' },
          { email: 'admin2@example.com', password: 'test123' },
        ],
      },
    })
  } catch (error) {
    console.error('Seed users error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
