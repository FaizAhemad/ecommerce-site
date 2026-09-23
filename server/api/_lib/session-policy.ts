export function sessionLimits(role: string) {
  return role === 'ADMIN'
    ? { idleMs: 15 * 60_000, absoluteMs: 8 * 60 * 60_000 }
    : { idleMs: 30 * 60_000, absoluteMs: 24 * 60 * 60_000 }
}
export function sessionDeadline(session: { createdAt: Date; expiresAt: Date; user: { role: string } }) {
  const absolute = session.createdAt.getTime() + sessionLimits(session.user.role).absoluteMs
  // Old 30-day sessions cannot satisfy the new policy and require fresh login.
  if (session.expiresAt.getTime() > absolute) return 0
  return Math.min(session.expiresAt.getTime(), absolute)
}
