/**
 * Centralized token management utility.
 * All components MUST use this to read/write the auth token.
 * The canonical storage key is 'cp_token'.
 */

const TOKEN_KEY = 'cp_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Returns standard auth headers for fetch requests.
 * Usage: fetch('/api/...', { headers: authHeaders() })
 */
export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
