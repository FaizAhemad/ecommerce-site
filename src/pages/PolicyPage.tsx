import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPublishedPolicy, type PolicyKind } from '../api/policies'

type PolicyPageProps = {
  storefront: StorefrontApiResponse
  policy: PolicyKind
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

export function PolicyPage({ storefront, policy, onNavigate }: PolicyPageProps) {
  const { policies } = storefront.content
  const { i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0]
  const locale = ['en','hi','mr'].includes(language) ? language : 'en'
  const query = useQuery({ queryKey: ['policy', policy, locale], queryFn: ({ signal }) => getPublishedPolicy(policy, locale, signal), staleTime: 0, retry: false })
  const title =
    policy === 'privacy'
      ? policies.privacyTitle
      : policy === 'returns'
        ? policies.returnsTitle
        : policy === 'refund'
          ? policies.refundTitle
          : policy === 'terms' ? policies.termsTitle : policy === 'shipping' ? 'Shipping policy' : policy === 'cancellation' ? 'Cancellation policy' : 'Cookie policy'
  return (
    <section className="policy-page page-section" aria-labelledby="policy-title">
      <h1 id="policy-title">{query.data?.title ?? title}</h1>
      {query.isPending ? <p role="status">Loading policy…</p> : query.isError ? <div role="alert"><p>Unable to load the published policy.</p><button className="secondary-button" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</button></div> : query.data ? <>
        <p>Version {query.data.version} · Published {new Date(query.data.publishedAt).toLocaleDateString()}</p>
        {query.data.text.split(/\n\s*\n/).map((paragraph, index) => <p key={index} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{paragraph}</p>)}
      </> : <div className="policy-notice">
        <strong>{policies.missingContentStatus}</strong>
        <p>{policies.missingContentAction}</p>
        <a href="/support" onClick={onNavigate('/support')}>Contact support before proceeding if you need policy information.</a>
      </div>}
      <a className="secondary-button" href="/" onClick={onNavigate('/')}>
        {policies.backToHomeLabel}
      </a>
    </section>
  )
}
