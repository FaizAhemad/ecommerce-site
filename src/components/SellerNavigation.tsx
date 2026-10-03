import type { MouseEvent } from 'react'
import { Button } from './mui/Button'
import { Stack } from './mui/Stack'

export function SellerNavigation({
  admin = false,
  onNavigate,
}: {
  admin?: boolean
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const links = [
    [admin ? '/admin/sellers' : '/seller', admin ? 'Seller applications' : 'My application'],
    [admin ? '/admin/seller-products' : '/seller/products', admin ? 'Product moderation' : 'My products'],
    ...(!admin ? [['/seller/orders', 'Shop order records']] : [['/admin/fulfillment', 'Fulfillment oversight']]),
    ['/shops', 'Browse shops'],
    ['/support', 'Support'],
  ] as const
  return <Stack component="nav" aria-label={admin ? 'Admin marketplace tools' : 'Marketplace navigation'} direction="row" spacing={1} sx={{ flexWrap: 'wrap', py: 1 }}>
    {links.map(([href, label]) => <Button key={href} component="a" href={href} onClick={onNavigate(href)} variant="outlined" size="small">{label}</Button>)}
  </Stack>
}
