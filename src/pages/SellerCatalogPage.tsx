import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { FormDialog } from '../components/FormDialog'
import { useNotification } from '../components/NotificationProvider'
import './SellerCatalogPage.css'
import { SellerNavigation } from '../components/SellerNavigation'
import { SellerMediaLibrary } from '../components/SellerMediaLibrary'

type Draft = { id: string; shopId: string; shopName: string; name: string; category: string; description: string; priceMinor: number; compareAtPriceMinor?: number | null; stock: number; mediaIds: string[]; status: string; version: number; reason: string }
type Result = { shops: { id: string; name: string }[]; products: Draft[]; nextPage: number | null }
async function json<T>(path: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const response = await apiFetch(path, init)
  const value = await response.json()
  if (!response.ok) throw new Error(value.error?.message ?? 'Unable to complete this request.')
  return value as T
}
function MediaPreview({ shopId, id }: { shopId: string; id: string }) {
  const query = useQuery({ queryKey: privateKey('seller-media', shopId, id), retry: false,
    queryFn: ({ signal }) => json<{ data: string; contentType: string }>(`/api/seller/media?shopId=${encodeURIComponent(shopId)}&id=${encodeURIComponent(id)}`, { signal }),
  })
  if (query.isPending) return <p role="status">Loading attachment…</p>
  if (!query.data) return <button type="button" className="secondary-button" onClick={() => void query.refetch()}>Retry attachment</button>
  return query.data.contentType.startsWith('video/') ? <video controls preload="metadata" src={query.data.data} /> : <img src={query.data.data} alt="Seller product attachment" />
}
export function SellerCatalogPage({ admin = false }: { admin?: boolean }) {
  const notify = useNotification(), lock = useRef(false), abortRef = useRef<AbortController | null>(null)
  const [shopId, setShopId] = useState(''), [page, setPage] = useState(0)
  const [draft, setDraft] = useState<Draft | null>(null), [price, setPrice] = useState(''), [comparePrice, setComparePrice] = useState('')
  const [reason, setReason] = useState(''), [decision, setDecision] = useState('APPROVED')
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [mediaShop, setMediaShop] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const uploads = useRef(new WeakMap<File, string>()), uploaded = useRef(new Set<string>())
  const endpoint = admin ? '/api/admin/seller-products' : '/api/seller/catalog'
  const query = useQuery({ queryKey: privateKey('seller-catalog', admin, shopId, page), retry: false,
    queryFn: ({ signal }) => json<Result>(`${endpoint}?page=${page}&${shopId ? `shopId=${encodeURIComponent(shopId)}` : ''}`, { signal }),
  })
  const categories = useQuery({ queryKey: ['seller-categories'], retry: false, enabled: !admin,
    queryFn: ({ signal }) => json<{ categories: string[] }>('/api/categories', { signal }),
  })
  useEffect(() => () => abortRef.current?.abort(), [])
  const currentShop = query.data?.shops.find(shop => shop.id === shopId) ?? query.data?.shops[0]
  function edit(item?: Draft) {
    if (!item && !currentShop) return
    setDraft(item ? { ...item, mediaIds: [...item.mediaIds] } : { id: crypto.randomUUID(), shopId: currentShop!.id, shopName: currentShop!.name, name: '', category: '', description: '', priceMinor: 0, stock: 0, mediaIds: [], status: 'DRAFT', version: 0, reason: '' })
    setPrice(item ? (item.priceMinor / 100).toFixed(2) : '')
    setComparePrice(item?.compareAtPriceMinor ? (item.compareAtPriceMinor / 100).toFixed(2) : '')
    setFiles([]); setReason(''); setDecision('APPROVED'); setError(''); setArchiveConfirm(false)
  }
  async function save(action: 'save' | 'submit' | 'archive' | 'review') {
    if (!draft || lock.current) return
    lock.current = true; setBusy(true); setError('')
    const generation = sessionGeneration(), controller = new AbortController()
    abortRef.current = controller
    const signal = AbortSignal.any([controller.signal, sessionSignal()])
    try {
      const mediaIds = [...draft.mediaIds]
      if (!admin && action !== 'archive') {
        if (!/^\d+(?:\.\d{1,2})?$/.test(price)) throw new Error('Enter a price with up to two decimal places.')
        if (comparePrice && (!/^\d+(?:\.\d{1,2})?$/.test(comparePrice) || Number(comparePrice) <= Number(price))) throw new Error('Original price must be higher than the selling price.')
        if (mediaIds.length + files.length > 3) throw new Error('Keep up to three media attachments.')
        for (const file of files) {
          if (file.size > 1000000) throw new Error('Each attachment must be no larger than 1 MB.')
          let id = uploads.current.get(file)
          if (!id) { id = crypto.randomUUID(); uploads.current.set(file, id) }
          if (!uploaded.current.has(id)) {
            const data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Unable to read attachment.')); reader.readAsDataURL(file)
            })
            signal.throwIfAborted()
            await json('/api/seller/media', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, shopId: draft.shopId, data, contentType: file.type }) })
            uploaded.current.add(id)
          }
          mediaIds.push(id)
        }
      }
      await json(endpoint, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, priceMinor: Math.round(Number(price) * 100), compareAtPriceMinor: comparePrice ? Math.round(Number(comparePrice) * 100) : null, mediaIds, expectedVersion: draft.version, action, ...(admin ? { status: decision, reason } : {}) }) })
      if (generation !== sessionGeneration() || signal.aborted) return
      setDraft(null); setFiles([])
      notify(action === 'archive' ? 'Product draft archived.' : admin ? 'Review recorded. This product is not published for sale.' : action === 'submit' ? 'Product submitted for review.' : 'Product draft saved.', 'success')
      await query.refetch({ cancelRefetch: false })
    } catch (failure) {
      if (generation === sessionGeneration() && !signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to save. Refresh before retrying.')
    } finally { lock.current = false; if (generation === sessionGeneration() && !signal.aborted) setBusy(false) }
  }
  return <section className="page-section seller-catalog">
    <p className="eyebrow">Gadgify marketplace</p><h1>{admin ? 'Product moderation' : 'Seller workspace'}</h1>
    <SellerNavigation admin={admin} />
    <p>Approval publishes your product in the catalog and shop showcase. Shop purchasing and payouts are not available yet. Editing approved content removes it from public listings until it is reviewed again. Stock changes adjust the previous published quantity without replacing reserved stock.</p>
    <div className="profile-actions">
      {!admin && currentShop && <label>Shop<select value={currentShop.id} disabled={busy} onChange={event => { setShopId(event.target.value); setPage(0) }}>{query.data?.shops.map(shop => <option value={shop.id} key={shop.id}>{shop.name}</option>)}</select></label>}
      {!admin && currentShop && <button className="primary-button" disabled={busy} onClick={() => edit()}>Add product</button>}
      {!admin && currentShop && <button className="secondary-button" disabled={busy || !!draft} onClick={() => setMediaShop(currentShop.id)}>Manage media storage</button>}
      <button className="secondary-button" disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh</button>
    </div>
    {query.isPending && <p role="status">Loading products…</p>}
    {query.isError && <p role="alert">Unable to load the workspace. Refresh to try again.</p>}
    {query.isSuccess && !admin && !currentShop && <p>An approved shop and active membership are required. Check your application status.</p>}
    {query.isSuccess && (admin || currentShop) && !query.data.products.length && <p>No product drafts on this page.</p>}
    <div className="seller-product-grid">{query.data?.products.map(product => <article className="record-card" key={product.id}>
      <small>{product.shopName} · {product.status}</small><h2>{product.name}</h2><p>₹{(product.priceMinor / 100).toFixed(2)} · Stock {product.stock}</p><p>{product.category} · {product.mediaIds.length} attachments</p>
      {product.reason && <p>Review: {product.reason}</p>}
      {(admin || product.status !== 'ARCHIVED') && <button className="secondary-button" disabled={busy} onClick={() => edit(product)}>{admin ? 'Inspect product' : 'Edit product'}</button>}
    </article>)}</div>
    <div className="profile-actions"><button className="secondary-button" disabled={busy || page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</button><button className="secondary-button" disabled={busy || query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</button></div>
    {mediaShop && <SellerMediaLibrary key={mediaShop} shopId={mediaShop} onClose={() => setMediaShop(null)} onRemoved={() => uploaded.current.clear()} />}
    <FormDialog open={!!draft} title={admin ? 'Review product' : draft?.version ? 'Edit product' : 'Add product'} busy={busy} onClose={() => setDraft(null)}>
      {draft && <form className="auth-form" onSubmit={(event: FormEvent) => { event.preventDefault(); void save(admin ? 'review' : 'save') }}>
        {admin ? <><h3>{draft.name}</h3><p>{draft.description}</p><p>{draft.category} · ₹{(draft.priceMinor / 100).toFixed(2)} · Stock {draft.stock}</p></> : <>
          <label>Product name<input required minLength={2} maxLength={120} value={draft.name} disabled={busy} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Description<textarea required minLength={10} maxLength={4000} value={draft.description} disabled={busy} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
          <label>Category<select required value={draft.category} disabled={busy || !categories.data} onChange={event => setDraft({ ...draft, category: event.target.value })}><option value="">Choose category</option>{categories.data?.categories.map(category => <option key={category}>{category}</option>)}</select></label>
          {categories.isError && <button type="button" className="secondary-button" onClick={() => void categories.refetch()}>Retry categories</button>}
          <label>Price (INR)<input type="number" required min="1" max="1000000" step="0.01" value={price} disabled={busy} onChange={event => setPrice(event.target.value)} /></label>
          <label>Original price (optional)<input type="number" min="1" max="1000000" step="0.01" value={comparePrice} disabled={busy} onChange={event => setComparePrice(event.target.value)} /><small>Shown crossed out when higher than the selling price.</small></label>
          <label>Stock<input type="number" required min="0" max="1000000" step="1" value={draft.stock} disabled={busy} onChange={event => setDraft({ ...draft, stock: Number(event.target.value) })} /></label>
        </>}
        <div className="seller-media-grid">{draft.mediaIds.map(id => <div key={id}><MediaPreview shopId={draft.shopId} id={id} />{!admin && <button type="button" className="secondary-button" disabled={busy} onClick={() => setDraft({ ...draft, mediaIds: draft.mediaIds.filter(value => value !== id) })}>Remove attachment</button>}</div>)}</div>
        {!admin && <label>Images or videos (up to 3, 1 MB each)<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" disabled={busy} onChange={event => setFiles(Array.from(event.target.files ?? []))} /></label>}
        {admin && draft.status === 'PENDING' && <><label>Decision<select value={decision} disabled={busy} onChange={event => setDecision(event.target.value)}><option value="APPROVED">Approve content</option><option value="REJECTED">Request changes</option></select></label><label>Reason<textarea required minLength={3} maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label></>}
        {error && <p role="alert">{error}</p>}
        <div className="profile-actions">
          {(!admin || draft.status === 'PENDING') && <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : admin ? 'Confirm review' : 'Save draft'}</button>}
          {!admin && <><button type="button" className="secondary-button" disabled={busy} onClick={() => void save('submit')}>Submit for review</button>{draft.version > 0 && <button type="button" className="secondary-button" disabled={busy} onClick={() => archiveConfirm ? void save('archive') : setArchiveConfirm(true)}>{archiveConfirm ? 'Confirm archive' : 'Archive draft'}</button>}</>}
        </div>
        {archiveConfirm && <p>This removes the product from review/showcase. Archived drafts cannot be edited. <button type="button" className="secondary-button" disabled={busy} onClick={() => setArchiveConfirm(false)}>Keep product</button></p>}
      </form>}
    </FormDialog>
  </section>
}
