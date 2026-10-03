import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPublishedPolicy, type PolicyKind } from '../api/policies'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { CircularProgress } from '../components/mui/CircularProgress'
import { Container } from '../components/mui/Container'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

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
    <Container component="main" maxWidth="md" aria-labelledby="policy-title" sx={{ py: { xs: 3, sm: 5, md: 7 } }}>
      <Stack spacing={2}>
        <Typography variant="overline" color="text.secondary">Policies</Typography>
        <Typography component="h1" id="policy-title" variant="h2" sx={{ fontSize: { xs: '2rem', sm: '2.75rem' } }}>{query.data?.title ?? title}</Typography>
        {query.isPending ? <Alert severity="info" role="status"><CircularProgress size={16} sx={{ mr: 1 }} />Loading published policy…</Alert> : query.isError ? <Alert severity="error" role="alert" action={<Button color="inherit" size="small" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>{query.isFetching ? 'Loading…' : 'Try again'}</Button>}>Unable to load the published policy. Your view has not changed.</Alert> : query.data ? <>
          <Typography variant="caption" color="text.secondary">Version {query.data.version} · Published {new Date(query.data.publishedAt).toLocaleDateString()}</Typography>
          <Stack spacing={1}>{query.data.text.split(/\n\s*\n/).map((paragraph, index) => <Typography component="p" key={index} sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{paragraph}</Typography>)}</Stack>
        </> : <Alert severity="warning"><Typography component="strong" sx={{ display: 'block' }}>{policies.missingContentStatus}</Typography><Typography component="p">{policies.missingContentAction}</Typography><Button component="a" href="/support" onClick={onNavigate('/support')} variant="outlined">Contact support before proceeding</Button></Alert>}
        <Button component="a" variant="outlined" href="/" onClick={onNavigate('/')}>{policies.backToHomeLabel}</Button>
      </Stack>
    </Container>
  )
}
