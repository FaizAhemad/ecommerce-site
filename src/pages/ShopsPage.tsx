import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import './SellerCatalogPage.css'
type Product = { id: string; name: string; description: string; category: string; mediaIds: string[]; priceMinor: number; catalogId: string | null }
function ShopMedia({ slug, productId, id }: { slug: string; productId: string; id: string }) {
  const query = useQuery({ queryKey: ['shop-media', slug, productId, id], retry: false, gcTime: 0, staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await apiFetch(`/api/shops?slug=${encodeURIComponent(slug)}&productId=${encodeURIComponent(productId)}&mediaId=${encodeURIComponent(id)}`, { signal, cache: 'no-store' })
      if (!response.ok) throw new Error('Media unavailable')
      return await response.json() as { data: string; contentType: string }
    },
  })
  if (query.isPending) return <p role="status">Loading media…</p>
  if (!query.data || query.isError) return <p>Media unavailable.</p>
  return query.data.contentType.startsWith('video/') ? <video controls preload="metadata" src={query.data.data} /> : <img src={query.data.data} alt="Shop product" />
}
export function ShopsPage({ slug }: { slug?: string }) {
  const [page, setPage] = useState(0), [preview, setPreview] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['marketplace-shops', slug, page], retry: false, gcTime: 0, staleTime: 0, queryFn: async ({ signal }) => {
    const response = await apiFetch(`/api/shops?page=${page}${slug ? `&slug=${encodeURIComponent(slug)}` : ''}`, { signal, cache: 'no-store' })
    if (!response.ok) throw new Error(response.status === 404 ? 'This shop is unavailable.' : 'Unable to load shops.')
    return await response.json() as { shops?: { name: string; slug: string }[]; shop?: { name: string; slug: string }; products?: Product[]; nextPage: number | null }
  } })
  return <section className="page-section"><p className="eyebrow">Gadgify marketplace</p><h1>{query.data?.shop?.name ?? (slug ? 'Shop showcase' : 'Discover shops')}</h1>
    <p>Explore approved shop products. Products become orderable through Gadgify after the shop accepts its fee offer.</p>
    <div className="profile-actions"><a className="secondary-button" href="/shops">All shops</a><a className="secondary-button" href="/seller">Sell with us</a><button className="secondary-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Refresh</button></div>
    {query.isPending && <p role="status">Loading…</p>}{query.isError && <p role="alert">{query.error.message}</p>}
    {!query.isError && query.data?.shops?.map(shop => <article className="record-card" key={shop.slug}><h2>{shop.name}</h2><a href={`/shops/${encodeURIComponent(shop.slug)}`}>Visit shop</a></article>)}
    {!query.isError && query.data?.products?.map(product => <article className="record-card" key={product.id}><small>{product.category}</small><h2>{product.name}</h2><p>{product.description}</p>
      <p>₹{(product.priceMinor / 100).toFixed(2)}</p>
      {product.catalogId && <a className="secondary-button" href={`/product/${encodeURIComponent(product.catalogId)}`}>View product details</a>}
      {product.mediaIds.length > 0 && <button className="secondary-button" onClick={() => setPreview(preview === product.id ? null : product.id)}>{preview === product.id ? 'Hide media' : 'View product media'}</button>}
      {preview === product.id && slug && <div className="seller-media-grid">{product.mediaIds.map(id => <ShopMedia key={id} slug={slug} productId={product.id} id={id} />)}</div>}
    </article>)}
    {query.isSuccess && !(query.data.shops?.length || query.data.products?.length) && <p>{slug ? 'No approved products to show yet.' : 'No approved shops to show yet.'}</p>}
    <div className="profile-actions"><button className="secondary-button" disabled={page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</button><button className="secondary-button" disabled={query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</button></div>
  </section>
}
