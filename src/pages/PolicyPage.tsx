import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'

type PolicyPageProps = { storefront: StorefrontApiResponse; policy: 'privacy' | 'returns' | 'refund' | 'terms'; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }

export function PolicyPage({ storefront, policy, onNavigate }: PolicyPageProps) {
  const { policies } = storefront.content
  const title = policy === 'privacy' ? policies.privacyTitle : policy === 'returns' ? policies.returnsTitle : policy === 'refund' ? policies.refundTitle : policies.termsTitle
  return <section className="policy-page page-section" aria-labelledby="policy-title"><p className="eyebrow">{policies.missingContentLabel}</p><h1 id="policy-title">{title}</h1><div className="policy-notice"><strong>{policies.missingContentStatus}</strong><p>{policies.missingContentAction}</p></div><a className="secondary-button" href="/" onClick={onNavigate('/')}>{policies.backToHomeLabel}</a></section>
}
