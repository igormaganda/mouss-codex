import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET: string = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required') })()
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {} as jwt.VerifyOptions) as JwtPayload
  } catch {
    return null
  }
}
