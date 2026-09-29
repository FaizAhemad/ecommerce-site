import type { ReactNode } from 'react'

export function PageContainer({ path, children }: { path: string; children: ReactNode }) {
  const width = /^\/(login|signup|forgot-password|reset-password|verify-email)\/?$/.test(
    path,
  )
    ? 'form'
    : /^\/(seller|admin\/sellers|support-requests|admin\/support|track-order|privacy|returns|refund-policy|terms|terms-and-conditions|shipping|cancellation|cookies)\/?$/.test(
          path,
        )
      ? 'reading'
      : /^\/(shops|seller|admin\/fulfillment|admin\/seller-products|cart|orders|checkout|profile|product)(\/|$)/.test(path)
        ? 'content'
        : 'wide'
  return (
    <main className="page-container" data-width={width}>
      {children}
    </main>
  )
}
