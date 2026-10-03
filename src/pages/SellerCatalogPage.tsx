import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { FormDialog } from '../components/FormDialog'
import { useNotification } from '../components/NotificationProvider'
import './SellerCatalogPage.css'
import { SellerNavigation } from '../components/SellerNavigation'
import { SellerMediaLibrary } from '../components/SellerMediaLibrary'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Box } from '../components/mui/Box'
import { Chip } from '../components/mui/Chip'
import { FormControl } from '../components/mui/FormControl'
import { InputLabel } from '../components/mui/InputLabel'
import { MenuItem } from '../components/mui/MenuItem'
import { Paper } from '../components/mui/Paper'
import { Select } from '../components/mui/Select'
import { Stack } from '../components/mui/Stack'
import { TextField } from '../components/mui/TextField'
import { Typography } from '../components/mui/Typography'

type Offer = { status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED'; type: 'FIXED_PER_UNIT' | 'PERCENTAGE'; value: number; version: number; proposedAt: string; responseAt?: string; acceptedVersion?: number | null }
type Draft = { id: string; shopId: string; shopName: string; name: string; category: string; description: string; priceMinor: number; compareAtPriceMinor?: number | null; stock: number; mediaIds: string[]; status: string; version: number; reason: string; offerVersion?: number; offer?: Offer }
type Result = { shops: { id: string; name: string }[]; products: Draft[]; nextPage: number | null }
async function json<T>(path: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const response = await apiFetch(path, init)
  const value = await response.json()
  if (!response.ok) throw new Error(value.error?.message ?? 'Unable to complete this request.')
  return value as T
}
function offerLabel(offer: Offer) {
  return offer.type === 'FIXED_PER_UNIT' ? `₹${(offer.value / 100).toFixed(2)} per unit sold` : `${(offer.value / 100).toFixed(2)}% of the discounted item price`
}
function MediaPreview({ shopId, id }: { shopId: string; id: string }) {
  const query = useQuery({ queryKey: privateKey('seller-media', shopId, id), retry: false,
    queryFn: ({ signal }) => json<{ data: string; contentType: string }>(`/api/seller/media?shopId=${encodeURIComponent(shopId)}&id=${encodeURIComponent(id)}`, { signal }),
  })
  if (query.isPending) return <p role="status">Loading attachment…</p>
  if (!query.data) return <Button type="button" variant="outlined" onClick={() => void query.refetch()}>Retry attachment</Button>
  return query.data.contentType.startsWith('video/') ? <video controls preload="metadata" src={query.data.data} /> : <img src={query.data.data} alt="Seller product attachment" />
}
export function SellerCatalogPage({ admin = false, onNavigate }: { admin?: boolean; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const notify = useNotification(), lock = useRef(false), abortRef = useRef<AbortController | null>(null)
  const [shopId, setShopId] = useState(''), [page, setPage] = useState(0)
  const [draft, setDraft] = useState<Draft | null>(null), [price, setPrice] = useState(''), [comparePrice, setComparePrice] = useState(''), [feeType, setFeeType] = useState<Offer['type']>('FIXED_PER_UNIT'), [feeInput, setFeeInput] = useState('')
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
    setFeeType(item?.offer?.type ?? 'FIXED_PER_UNIT')
    setFeeInput(item?.offer ? (item.offer.value / 100).toFixed(2) : '')
    setFiles([]); setReason(''); setDecision('APPROVED'); setError(''); setArchiveConfirm(false)
  }
  async function save(action: 'save' | 'submit' | 'archive' | 'review') {
    if (!draft || lock.current) return
    lock.current = true; setBusy(true); setError('')
    const generation = sessionGeneration(), controller = new AbortController()
    abortRef.current = controller
    const signal = AbortSignal.any([controller.signal, sessionSignal()])
    try {
      let feeValue: number | undefined
      if (admin && action === 'review' && decision === 'APPROVED') {
        if (!/^\d+(?:\.\d{1,2})?$/.test(feeInput) || Number(feeInput) <= 0 || Number(feeInput) > (feeType === 'FIXED_PER_UNIT' ? Math.min(10000000, draft.priceMinor / 100) : 100)) throw new Error(feeType === 'FIXED_PER_UNIT' ? 'Enter a fixed per-unit fee that does not exceed the product price.' : 'Enter a percentage from 0.01% to 100%.')
        feeValue = Math.round(Number(feeInput) * 100)
      }
      const mediaIds = [...draft.mediaIds]
      if (!admin && action !== 'archive') {
        if (draft.name.trim().length < 2 || draft.name.trim().length > 120) throw new Error('Enter a product name between 2 and 120 characters.')
        if (draft.description.trim().length < 10 || draft.description.trim().length > 4000) throw new Error('Enter a product description between 10 and 4,000 characters.')
        if (!draft.category.trim()) throw new Error('Choose a product category.')
        if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) < 1 || Number(price) > 1000000) throw new Error('Enter a price from ₹1 to ₹10,00,000 with up to two decimal places.')
        if (comparePrice && (!/^\d+(?:\.\d{1,2})?$/.test(comparePrice) || Number(comparePrice) <= Number(price))) throw new Error('Original price must be higher than the selling price.')
        if (!Number.isSafeInteger(draft.stock) || draft.stock < 0 || draft.stock > 1000000) throw new Error('Enter stock as a whole number from 0 to 1,000,000.')
        if (mediaIds.length + files.length > 10) throw new Error('A product can have up to 10 photos and videos in total. Remove an attachment to continue.')
        for (const file of files) {
          if (file.size > 1000000) throw new Error('Each attachment must be no larger than 1 MB.')
          if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'].includes(file.type)) throw new Error(`“${file.name}” is not a supported image or video format.`)
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
      await json(endpoint, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, priceMinor: Math.round(Number(price) * 100), compareAtPriceMinor: comparePrice ? Math.round(Number(comparePrice) * 100) : null, mediaIds, expectedVersion: draft.version, action, ...(admin ? { status: decision, reason, feeType, feeValue } : {}) }) })
      if (generation !== sessionGeneration() || signal.aborted) return
      setDraft(null); setFiles([])
      notify(action === 'archive' ? 'Product draft archived.' : admin && decision === 'APPROVED' ? 'Content approved. Gadgify’s fee offer is waiting for the shop’s decision.' : admin ? 'Product review recorded.' : action === 'submit' ? 'Product submitted for review.' : 'Product draft saved.', 'success')
      await query.refetch({ cancelRefetch: false })
    } catch (failure) {
      if (generation === sessionGeneration() && !signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to save. Refresh before retrying.')
    } finally { lock.current = false; if (generation === sessionGeneration() && !signal.aborted) setBusy(false) }
  }
  async function respondToOffer(product: Draft, accept: boolean) {
    if (!product.offer || lock.current) return
    lock.current = true; setBusy(true); setError('')
    const generation = sessionGeneration(), controller = new AbortController()
    abortRef.current = controller
    try {
      await json(endpoint, { method: 'POST', signal: AbortSignal.any([controller.signal, sessionSignal()]), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, shopId: product.shopId, expectedVersion: product.version, offerVersion: product.offer.version, action: accept ? 'offer_accept' : 'offer_reject' }) })
      if (generation !== sessionGeneration() || controller.signal.aborted) return
      notify(accept ? 'Fee offer accepted. This product can now be ordered through Gadgify.' : 'Offer declined. Contact Gadgify if you want to discuss different terms.', accept ? 'success' : 'info')
      await query.refetch({ cancelRefetch: false })
    } catch (failure) {
      if (generation === sessionGeneration() && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to record your decision. Refresh before retrying.')
    } finally { lock.current = false; if (generation === sessionGeneration() && !controller.signal.aborted) setBusy(false) }
  }
  return <Stack component="main" spacing={2.5} sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
    <Stack spacing={1}><Typography variant="overline" color="text.secondary">Gadgify marketplace</Typography><Typography component="h1" variant="h3">{admin ? 'Product moderation' : 'Seller workspace'}</Typography></Stack>
    <SellerNavigation admin={admin} onNavigate={onNavigate} />
    {error && !draft && <Alert severity="error" role="alert" action={<Button color="inherit" size="small" disabled={query.isFetching} onClick={() => { setError(''); void query.refetch({ cancelRefetch: false }) }}>Refresh</Button>}>{error}</Alert>}
    <Typography color="text.secondary">Gadgify reviews product content and proposes a per-unit INR fee or a percentage of the discounted item price. Products become orderable through Gadgify only after the shop accepts the exact offer. Editing approved content withdraws it until it is reviewed again.</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ alignItems: { sm: 'center' } }}>
      {!admin && currentShop && <FormControl size="small" sx={{ minWidth: 220 }}><InputLabel id="seller-catalog-shop">Shop</InputLabel><Select labelId="seller-catalog-shop" label="Shop" value={currentShop.id} disabled={busy} onChange={event => { setShopId(String(event.target.value)); setPage(0) }}>{query.data?.shops.map(shop => <MenuItem value={shop.id} key={shop.id}>{shop.name}</MenuItem>)}</Select></FormControl>}
      {!admin && currentShop && <Button variant="contained" disabled={busy} onClick={() => edit()}>Add product</Button>}
      {!admin && currentShop && <Button variant="outlined" disabled={busy || !!draft} onClick={() => setMediaShop(currentShop.id)}>Manage media storage</Button>}
      <Button variant="outlined" disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh</Button>
    </Stack>
    {query.isPending && <Paper variant="outlined" role="status" sx={{ p: 3 }}><Typography color="text.secondary">Loading products…</Typography></Paper>}
    {query.isError && <Alert severity="error" action={<Button color="inherit" size="small" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load the workspace.</Alert>}
    {query.isSuccess && !admin && !currentShop && <Alert severity="info">An approved shop and active membership are required. Check your application status.</Alert>}
    {query.isSuccess && (admin || currentShop) && !query.data.products.length && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No product drafts on this page</Typography></Paper>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>{query.data?.products.map(product => <Paper variant="outlined" component="article" key={product.id} sx={{ p: 2.5 }}>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="caption" color="text.secondary">{product.shopName}</Typography><Chip size="small" label={product.status.replaceAll('_', ' ')} color={product.status === 'APPROVED' ? 'success' : product.status === 'REJECTED' ? 'error' : 'default'} /></Stack>
        <Typography component="h2" variant="h6">{product.name}</Typography><Typography variant="body2" color="text.secondary">₹{(product.priceMinor / 100).toFixed(2)} · Stock {product.stock}</Typography><Typography variant="body2">{product.category} · {product.mediaIds.length} attachments</Typography>
        {product.reason && <Alert severity="info">Review: {product.reason}</Alert>}
        {product.offer && <Alert severity={product.offer.status === 'ACCEPTED' ? 'success' : product.offer.status === 'PROPOSED' ? 'warning' : 'info'}>
          {product.offer.status === 'PROPOSED' ? `Gadgify proposes ${offerLabel(product.offer)}. Accept to make this product orderable through Gadgify, or decline to discuss the terms.` : product.offer.status === 'ACCEPTED' ? `Fee terms accepted: ${offerLabel(product.offer)}.` : `Offer declined: ${offerLabel(product.offer)}. Contact Gadgify to discuss new terms.`}
        </Alert>}
        {!admin && product.offer?.status === 'PROPOSED' && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" disabled={busy} onClick={() => void respondToOffer(product, true)}>Accept fee offer</Button><Button variant="outlined" disabled={busy} onClick={() => void respondToOffer(product, false)}>Decline offer</Button></Stack>}
        {(admin || product.status !== 'ARCHIVED') && <Button variant="outlined" disabled={busy} onClick={() => edit(product)}>{admin ? 'Inspect product' : 'Edit product'}</Button>}
      </Stack>
    </Paper>)}</Box>
    <Stack direction="row" spacing={1}><Button variant="outlined" disabled={busy || page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outlined" disabled={busy || query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</Button></Stack>
    {mediaShop && <SellerMediaLibrary key={mediaShop} shopId={mediaShop} onClose={() => setMediaShop(null)} onRemoved={() => uploaded.current.clear()} />}
    <FormDialog open={!!draft} title={admin ? 'Review product' : draft?.version ? 'Edit product' : 'Add product'} busy={busy} onClose={() => setDraft(null)}>
      {draft && <Stack component="form" spacing={2} onSubmit={(event: FormEvent) => { event.preventDefault(); void save(admin ? 'review' : 'save') }}>
        {admin ? <><Typography variant="h6">{draft.name}</Typography><Typography>{draft.description}</Typography><Typography>{draft.category} · ₹{(draft.priceMinor / 100).toFixed(2)} · Stock {draft.stock}</Typography></> : <>
          <TextField label="Product name" required slotProps={{ htmlInput: { minLength: 2, maxLength: 120 } }} value={draft.name} disabled={busy} onChange={event => setDraft({ ...draft, name: event.target.value })} />
          <TextField label="Description" required slotProps={{ htmlInput: { minLength: 10, maxLength: 4000 } }} multiline minRows={4} value={draft.description} disabled={busy} onChange={event => setDraft({ ...draft, description: event.target.value })} />
          <FormControl required fullWidth disabled={busy || !categories.data}><InputLabel id="seller-category-label">Category</InputLabel><Select labelId="seller-category-label" label="Category" value={draft.category} onChange={event => setDraft({ ...draft, category: String(event.target.value) })}><MenuItem value="">Choose category</MenuItem>{categories.data?.categories.map(category => <MenuItem key={category} value={category}>{category}</MenuItem>)}</Select></FormControl>
          {categories.isError && <Button type="button" variant="outlined" onClick={() => void categories.refetch()}>Retry categories</Button>}
          <TextField label="Price (INR)" type="number" required slotProps={{ htmlInput: { min: 1, max: 1000000, step: 0.01 } }} value={price} disabled={busy} onChange={event => setPrice(event.target.value)} />
          <TextField label="Original price (optional)" type="number" slotProps={{ htmlInput: { min: 1, max: 1000000, step: 0.01 } }} value={comparePrice} disabled={busy} onChange={event => setComparePrice(event.target.value)} helperText="Shown crossed out when higher than the selling price." />
          <TextField label="Stock" type="number" required slotProps={{ htmlInput: { min: 0, max: 1000000, step: 1 } }} value={draft.stock} disabled={busy} onChange={event => setDraft({ ...draft, stock: Number(event.target.value) })} />
        </>}
        <div className="seller-media-grid">{draft.mediaIds.map(id => <div key={id}><MediaPreview shopId={draft.shopId} id={id} />{!admin && <button type="button" className="secondary-button" disabled={busy} onClick={() => setDraft({ ...draft, mediaIds: draft.mediaIds.filter(value => value !== id) })}>Remove attachment</button>}</div>)}</div>
        {!admin && <Stack spacing={1}>
          <label>Product photos and videos (up to 10 total, 1 MB each)<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" disabled={busy} onChange={event => {
            const added = Array.from(event.currentTarget.files ?? [])
            event.currentTarget.value = ''
            const existing = new Set(files.map(file => `${file.name}:${file.size}:${file.lastModified}`))
            const merged = [...files, ...added.filter(file => !existing.has(`${file.name}:${file.size}:${file.lastModified}`))]
            if (draft.mediaIds.length + merged.length > 10) {
              setError('A product can have up to 10 photos and videos in total. Remove a file or saved attachment first.')
              return
            }
            setError('')
            setFiles(merged)
          }} /></label>
          <Typography variant="caption" color="text.secondary">Mix images and MP4/WebM videos for this one product. Add more files in another selection; each file must be at most 1 MB.</Typography>
          {files.map((file, index) => <Stack key={`${file.name}:${file.size}:${file.lastModified}`} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{file.name} · {(file.size / 1024).toFixed(0)} KB</Typography>
            <Button type="button" size="small" variant="text" disabled={busy} onClick={() => setFiles(current => current.filter((_, fileIndex) => fileIndex !== index))}>Remove</Button>
          </Stack>)}
        </Stack>}
        {admin && (draft.status === 'PENDING' || (draft.status === 'APPROVED' && (!draft.offer || draft.offer.status === 'REJECTED'))) && <>
          <FormControl fullWidth disabled={busy}><InputLabel id="seller-review-decision">Decision</InputLabel><Select labelId="seller-review-decision" label="Decision" value={decision} onChange={event => setDecision(String(event.target.value))}><MenuItem value="APPROVED">Approve content and send fee offer</MenuItem><MenuItem value="REJECTED">Request product changes</MenuItem></Select></FormControl>
          {decision === 'APPROVED' && <><FormControl fullWidth disabled={busy}><InputLabel id="seller-fee-type">Fee basis</InputLabel><Select labelId="seller-fee-type" label="Fee basis" value={feeType} onChange={event => setFeeType(event.target.value as Offer['type'])}><MenuItem value="FIXED_PER_UNIT">Fixed INR per unit sold</MenuItem><MenuItem value="PERCENTAGE">Percentage of discounted item price</MenuItem></Select></FormControl><TextField label={feeType === 'FIXED_PER_UNIT' ? 'Fee per unit (INR)' : 'Commission percentage'} type="number" required slotProps={{ htmlInput: { min: 0.01, max: feeType === 'FIXED_PER_UNIT' ? Math.min(10000000, draft.priceMinor / 100) : 100, step: 0.01 } }} value={feeInput} disabled={busy} onChange={event => setFeeInput(event.target.value)} helperText={feeType === 'FIXED_PER_UNIT' ? 'Accrued for each sold unit. Discounts cannot reduce an item below this fee.' : 'Applied to the item price after discounts, excluding delivery and tax.'} /></>}
          <TextField label="Review note for the shop" required slotProps={{ htmlInput: { minLength: 3, maxLength: 1000 } }} multiline minRows={3} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} />
        </>}
        {error && <Alert severity="error" role="alert">{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {(!admin || draft.status === 'PENDING' || draft.status === 'APPROVED' && (!draft.offer || draft.offer.status === 'REJECTED')) && <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : admin ? decision === 'REJECTED' ? 'Request product changes' : draft.status === 'PENDING' || !draft.offer ? 'Send fee offer' : 'Send revised offer' : 'Save draft'}</Button>}
          {!admin && <><button type="button" className="secondary-button" disabled={busy} onClick={() => void save('submit')}>Submit for review</button>{draft.version > 0 && <button type="button" className="secondary-button" disabled={busy} onClick={() => archiveConfirm ? void save('archive') : setArchiveConfirm(true)}>{archiveConfirm ? 'Confirm archive' : 'Archive draft'}</button>}</>}
        </Stack>
        {archiveConfirm && <Alert severity="warning" action={<Button type="button" color="inherit" size="small" disabled={busy} onClick={() => setArchiveConfirm(false)}>Keep product</Button>}>This removes the product from review/showcase. Archived drafts cannot be edited.</Alert>}
      </Stack>}
    </FormDialog>
  </Stack>
}
