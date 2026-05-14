import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Hashing unhashed passwords...')

  const users = await prisma.user.findMany({
    select: { id: true, email: true, passwordHash: true },
  })

  let hashed = 0
  for (const user of users) {
    if (user.passwordHash.startsWith('$2b$')) {
      console.log(`  SKIP ${user.email} (already hashed)`)
      continue
    }

    const plaintext = user.passwordHash || 'password123'
    const hash = await bcrypt.hash(plaintext, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    })

    console.log(`  HASHED ${user.email}`)
    hashed++
  }

  console.log(`\nDone! ${hashed} password(s) hashed, ${users.length - hashed} skipped.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
