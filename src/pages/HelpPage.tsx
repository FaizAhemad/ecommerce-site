import type { MouseEvent } from 'react'

export function HelpPage({ onNavigate }: { onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const link = (path: string, label: string) => <a href={path} onClick={onNavigate(path)}>{label}</a>
  return <section className="page-section" aria-labelledby="help-title">
    <h1 id="help-title">How can we help?</h1>
    <p>Find your way around Gadgify, manage your account or follow up on an order.</p>
    <div className="profile-actions">{link('/support', 'Contact support')}{link('/support-requests', 'Track support requests')}{link('/orders', 'View orders')}</div>
    <details><summary>Finding and reviewing products</summary><p>Use {link('/products', 'Products')} to search and filter the catalogue. Open a product for details, available media and customer reviews. Sign in to submit or edit your own review.</p></details>
    <details><summary>Delivery addresses and account access</summary><p>Visit {link('/profile', 'Profile')} to manage your details and saved addresses. For trouble signing in, use {link('/forgot-password', 'Forgot password')}. Email verification links and status are available in Profile.</p></details>
    <details><summary>Checkout and payment status</summary><p>Review your cart and the confirmed charges before ordering. Checkout may be unavailable while the shop is configuring it. Payment is confirmed separately; if a request is interrupted, check {link('/orders', 'Orders')} before trying again.</p></details>
    <details><summary>Delivery, cancellation, returns and refunds</summary><p>Open your order for recorded tracking details. Read the published {link('/returns', 'returns policy')} and {link('/refund-policy', 'refund policy')}. If policy information is unavailable or you need a decision about your order, contact support with the order number before proceeding.</p></details>
    <details><summary>Following a support request</summary><p>Sign in to create a request, then visit {link('/support-requests', 'Support requests')} for its recorded status and resolution. A saved ticket remains trackable even when email confirmation is unavailable.</p></details>
    <p>For information about customer data, visit {link('/privacy', 'Privacy')}. Never send passwords or full payment-card details through support.</p>
  </section>
}
