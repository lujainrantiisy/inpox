export function normalizeEmail(value: string): string {
  return value.trim()
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value)
  const parts = email.split('@')

  if (!email || /\s/.test(email) || parts.length !== 2) return false

  const [localPart, domain] = parts
  const domainParts = domain.split('.')

  if (
    !localPart ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..') ||
    domainParts.length < 2
  ) {
    return false
  }

  return domainParts.every((part) => /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(part))
}
