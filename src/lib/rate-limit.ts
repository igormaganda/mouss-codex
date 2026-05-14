const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  options: {
    maxRequests?: number
    windowMs?: number
  } = {}
): RateLimitResult {
  const { maxRequests = 100, windowMs = 60000 } = options
  const now = Date.now()

  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 600000)
