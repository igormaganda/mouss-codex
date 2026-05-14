import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    headers: {
      authorization: request.headers.get('authorization') || '(missing)',
      contentType: request.headers.get('content-type') || '(missing)',
      origin: request.headers.get('origin') || '(missing)',
      userAgent: request.headers.get('user-agent') || '(missing)',
    },
    allHeaders: headers,
  })
}
