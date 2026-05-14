import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

async function createTestUsers() {
  console.log('🌱 Création des utilisateurs de test...')

  for (const user of testUsers) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      })

      if (existingUser) {
        console.log(`⚠️  Utilisateur ${user.email} existe déjà, mise à jour du mot de passe...`)
        const passwordHash = await bcrypt.hash(user.password, 10)
        await prisma.user.update({
          where: { email: user.email },
          data: { passwordHash },
        })
      } else {
        const passwordHash = await bcrypt.hash(user.password, 10)
        await prisma.user.create({
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
        console.log(`✅ ${user.role}: ${user.email} / ${user.password}`)
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création de ${user.email}:`, error)
    }
  }

  console.log('\n📋 Comptes créés :')
  console.log('\n👤 Porteurs de projet :')
  console.log('  - porteur1@example.com / test123')
  console.log('  - porteur2@example.com / test123')
  console.log('\n👨‍🏫 Conseillers :')
  console.log('  - conseiller1@example.com / test123')
  console.log('  - conseiller2@example.com / test123')
  console.log('\n🔧 Administrateurs :')
  console.log('  - admin1@example.com / test123')
  console.log('  - admin2@example.com / test123')

  await prisma.$disconnect()
}

createTestUsers()
