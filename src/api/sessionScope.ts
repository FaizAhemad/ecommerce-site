export type SessionUser = { id: string; role: string }
let user: SessionUser | null = null
let generation = 0
let controller = new AbortController()

export const sessionUser = () => user
export const sessionGeneration = () => generation
export const sessionSignal = () => controller.signal
export const privateKey = (...parts: unknown[]) => [
  'private',
  user?.id ?? 'guest',
  generation,
  ...parts,
]

export function changeSession(next: SessionUser | null) {
  controller.abort()
  controller = new AbortController()
  generation += 1
  user = next
}

export function assertCurrentSession(expected: number) {
  if (expected !== generation) throw new DOMException('Your session changed.', 'AbortError')
}
