export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caractères')
  if (!/[A-Z]/.test(password)) errors.push('Le mot de passe doit contenir au moins une majuscule')
  if (!/[a-z]/.test(password)) errors.push('Le mot de passe doit contenir au moins une minuscule')
  if (!/[0-9]/.test(password)) errors.push('Le mot de passe doit contenir au moins un chiffre')
  return { valid: errors.length === 0, errors }
}

export function validateName(name: string): boolean {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-ZÀ-ÿ\s\-']+$/.test(name)
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateLoginInput(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {}
  if (!email) errors.email = 'Email requis'
  else if (!validateEmail(email)) errors.email = 'Email invalide'
  if (!password) errors.password = 'Mot de passe requis'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateRegisterInput(name: string, email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Nom requis'
  else if (!validateName(name)) errors.name = 'Nom invalide'
  if (!email) errors.email = 'Email requis'
  else if (!validateEmail(email)) errors.email = 'Email invalide'
  if (!password) errors.password = 'Mot de passe requis'
  else {
    const pwValidation = validatePassword(password)
    if (!pwValidation.valid) errors.password = pwValidation.errors[0]
  }
  return { valid: Object.keys(errors).length === 0, errors }
}
