import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { SellerNavigation } from '../components/SellerNavigation'
type Item = { id: string; orderNumber: string; shopName: string; productName: string; quantity: number; unitPriceMinor: number; currency: string; status: string; createdAt: string }
export function SellerOrdersPage() {
  const [page, setPage] = useState(0)
  const query = useQuery({ queryKey: privateKey('seller-orders', page), retry: false, queryFn: async ({ signal }) => {
    const response = await apiFetch(`/api/seller/orders?page=${page}`, { signal })
    if (!response.ok) throw new Error('Unable to load order records.')
    return await response.json() as { items: Item[]; nextPage: number | null }
  } })
  return <section className="page-section"><h1>Shop order records</h1><SellerNavigation />
    <p>Only items attributed to your approved shops are shown. Order status describes the customer order, not an independent seller shipment. Marketplace fulfillment and settlements are not enabled yet.</p>
    <button className="secondary-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Refresh orders</button>
    {query.isPending && <p role="status">Loading orders…</p>}{query.isError && <p role="alert">Order records are unavailable. Refresh to retry.</p>}
    {query.data?.items.length === 0 && <p>No shop order records on this page.</p>}
    {query.data?.items.map(item => <article className="record-card" key={item.id}><h2>{item.orderNumber}</h2><p>{item.shopName} · {item.productName}</p><p>Quantity {item.quantity} · Unit price {item.currency} {(item.unitPriceMinor / 100).toFixed(2)}</p><p>Order status: {item.status}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}
    <div className="profile-actions"><button className="secondary-button" disabled={page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</button><button className="secondary-button" disabled={query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</button></div>
  </section>
}
