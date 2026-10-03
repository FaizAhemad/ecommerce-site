import { Button } from '../components/mui/Button'
import { Card } from '../components/mui/Card'
import { CardContent } from '../components/mui/CardContent'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

const destinations = [
  { href: '/products', title: 'Finding a product', text: 'Browse the catalog, search, use available filters and open an item for current price and stock details.' },
  { href: '/track-order', title: 'Tracking an order', text: 'Sign in to view your order and its latest recorded delivery updates.' },
  { href: '/returns', title: 'Returns and refunds', text: 'Read the published returns policy. A submitted return request does not itself issue a refund.' },
  { href: '/profile', title: 'Account and addresses', text: 'Manage your profile and saved delivery addresses after signing in.' },
] as const

export function HelpPage() {
  return <Stack component="main" spacing={{ xs: 3, sm: 4 }} sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
    <Stack spacing={1}>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Gadgify help</Typography>
      <Typography component="h1" variant="h2" sx={{ fontSize: { xs: '2rem', sm: '2.75rem' } }}>How can we help?</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 720 }}>Find the right place to get product, order, account, or policy information. Order and account details stay private to the signed-in customer.</Typography>
    </Stack>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button component="a" href="/support" variant="contained">Contact customer care</Button>
      <Button component="a" href="/support#website-tour" variant="outlined">Open Support and start the website tour</Button>
    </Stack>
    <Stack spacing={1.5}>
      {destinations.map(destination => <Card variant="outlined" component="article" key={destination.href}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Stack spacing={0.5}>
              <Typography component="h2" variant="h6">{destination.title}</Typography>
              <Typography variant="body2" color="text.secondary">{destination.text}</Typography>
            </Stack>
            <Button component="a" href={destination.href} variant="outlined" sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}>Open</Button>
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>
    <Typography variant="caption" color="text.secondary">Never send passwords, full card details, or sensitive medical information through support.</Typography>
  </Stack>
}
