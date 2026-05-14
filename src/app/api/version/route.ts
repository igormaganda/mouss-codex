import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: '2.0.1',
    commit: '94e8948',
    features: {
      authHeaders: true,
      corsFixed: true,
      jwtEnabled: true,
    },
    timestamp: new Date().toISOString(),
  })
}
