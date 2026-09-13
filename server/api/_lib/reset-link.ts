/** Only deployment configuration supplies the origin; never use the caller Host. */
export function passwordResetLink(base: string | undefined, token: string, production: boolean) {
  const url = new URL(base ?? '')
  if (
    url.username ||
    url.password ||
    (url.protocol !== 'https:' && (production || url.protocol !== 'http:'))
  )
    throw new Error('Invalid application origin')
  const link = new URL('/reset-password', url.origin)
  // Fragments are not sent to the web server or as HTTP Referer values.
  link.hash = new URLSearchParams({ token }).toString()
  return link.href
}
