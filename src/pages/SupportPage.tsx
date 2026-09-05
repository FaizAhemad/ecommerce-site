import type { StorefrontApiResponse } from '../api/storefront'

type SupportPageProps = { storefront: StorefrontApiResponse }

export function SupportPage({ storefront }: SupportPageProps) {
  const { contact, content, identity } = storefront
  return <section className="support-section page-section" aria-labelledby="support-title"><p className="eyebrow">{content.navigation.support}</p><h1 id="support-title">{content.support.title}</h1><p className="hero-text">{content.support.description}</p><div className="support-links"><a className="primary-button" href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a><a className="secondary-button" href={`tel:${contact.phone}`}>{contact.phone}</a></div><p className="support-business">{identity.businessName}</p></section>
}
