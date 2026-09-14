export function safeRouteId(value: string) {
  try {
    const id = decodeURIComponent(value)
    return id &&
      !id.includes('/') &&
      !id.includes('\\') &&
      !Array.from(id).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
      ? id
      : null
  } catch {
    return null
  }
}
