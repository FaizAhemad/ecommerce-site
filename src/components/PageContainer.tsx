import type { ReactNode } from 'react'

export function PageContainer({ path, children }: { path: string; children: ReactNode }) {
  const width = /^\/(login|signup)\/?$/.test(path)
    ? 'form'
    : /^\/(support|track-order|privacy|returns|refund-policy|terms|terms-and-conditions)\/?$/.test(
          path,
        )
      ? 'reading'
      : /^\/(cart|orders|checkout|product)(\/|$)/.test(path)
        ? 'content'
        : 'wide'
  return (
    <main className="page-container" data-width={width}>
      {children}
    </main>
  )
}
