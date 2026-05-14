import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, any>,
  }

  // Check database connection
  try {
    const userCount = await db.user.count()
    health.checks.database = {
      status: 'ok',
      userCount,
    }
  } catch (error: any) {
    health.checks.database = {
      status: 'error',
      error: error.message,
    }
    health.status = 'error'
  }

  // Check environment variables
  health.checks.env = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing',
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json(health)
}
