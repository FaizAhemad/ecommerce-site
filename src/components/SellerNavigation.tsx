export function SellerNavigation({ admin = false }: { admin?: boolean }) {
  return <nav className="profile-actions" aria-label="Marketplace navigation">
    <a className="secondary-button" href={admin ? '/admin/sellers' : '/seller'}>{admin ? 'Seller applications' : 'My application'}</a>
    <a className="secondary-button" href={admin ? '/admin/seller-products' : '/seller/products'}>{admin ? 'Product moderation' : 'My products'}</a>
    {!admin && <a className="secondary-button" href="/seller/orders">Shop order records</a>}
    {admin && <a className="secondary-button" href="/admin/fulfillment">Fulfillment oversight</a>}
    <a className="secondary-button" href="/shops">Browse shops</a>
    <a className="secondary-button" href="/support">Support</a>
  </nav>
}
