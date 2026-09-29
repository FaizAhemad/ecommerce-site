import { privateKey, sessionGeneration, assertCurrentSession } from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { CheckoutSettings } from '../components/CheckoutSettings'
import { CustomerMessages } from '../components/CustomerMessages'
import { ReturnRequests } from '../components/ReturnRequests'
import { AdminFeedback } from '../components/PurchaseFeedback'
import { PolicyEditor } from '../components/PolicyEditor'
import { CouponManager } from '../components/CouponManager'
import { ShipmentManager } from '../components/ShipmentManager'
import { NotificationHistory } from '../components/NotificationHistory'
import { PaymentRefunds } from '../components/PaymentRefunds'
import { FormDialog } from '../components/FormDialog'
import { DataGrid, type DataGridQuery } from '../components/DataGrid'
import { Archive, ChevronDown, Image as ImageIcon, Pencil, Upload } from 'lucide-react'
import { apiFetch as fetch, LONG_RUNNING_API_TIMEOUT_MS } from '../api/http'
import { csrfToken } from '../api/csrf'
import { queryClient } from '../api/queryClient'
import { upload as uploadBlob } from '@vercel/blob/client'
import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { Box } from '../components/mui/Box'
import { Button } from '../components/mui/Button'
import { Card } from '../components/mui/Card'
import { Stack } from '../components/mui/Stack'
import { TextField } from '../components/mui/TextField'
import { Typography } from '../components/mui/Typography'
import { Chip } from '../components/mui/Chip'
type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
type AdminProduct = {
  id: string
  name: string
  category: string
  priceMinor: number
  shippingFeeMinor: number | null
  compareAtPriceMinor?: number | null
  stock: number
  isActive: boolean
  description?: string | null
  colors?: { name: string; hex: string }[]
  images?: { url: string; alt?: string; sortOrder: number }[]
  videos?: { url: string; poster?: string | null; sortOrder: number }[]
}

type Section =
  | 'overview'
  | 'products'
  | 'orders'
  | 'payments'
  | 'returns'
  | 'customers'
  | 'messages'
  | 'analytics'
  | 'settings'
  | 'feedback'
  | 'policies'
  | 'coupons'
  | 'shipments'
  | 'notifications'
const tabs: { id: Section; label: string }[] = [
  'overview',
  'products',
  'orders',
  'payments',
  'returns',
  'customers',
  'messages',
  'analytics',
  'settings',
  'feedback',
  'policies',
  'coupons',
  'shipments',
  'notifications',
].map((id) => ({ id: id as Section, label: id[0].toUpperCase() + id.slice(1) }))
export function AdminPage({ storefront, onNavigate }: Props) {
  const notify = useNotification()
  const generation = sessionGeneration()
  const actionLock = useRef(false)
  const categoryLock = useRef(false)
  const uploadCache = useRef(new WeakMap<File, string>())
  const [saveStage, setSaveStage] = useState('Saving...')
  const [loadStates, setLoadStates] = useState<Record<string, 'loading' | 'error' | 'ready'>>({})
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [productOpen, setProductOpen] = useState(false)
  const [keptImages, setKeptImages] = useState<NonNullable<AdminProduct['images']>>([])
  const [keptVideos, setKeptVideos] = useState<NonNullable<AdminProduct['videos']>>([])
  const beginEdit = (product: AdminProduct | null) => {
    productFormRef.current?.reset()
    setEditing(product)
    setKeptImages([...(product?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder))
    setKeptVideos([...(product?.videos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder))
  }
  const loadRevision = useRef<Record<string, number>>({})
  const gridUrls = useRef({
    products: '/api/admin/products?page=1&pageSize=10',
    orders: '/api/admin/orders?page=1&pageSize=10',
    customers: '/api/admin/customers?page=1&pageSize=10',
  })
  const productFormRef = useRef<HTMLFormElement>(null)
  const selectedMedia = useRef(new Map<HTMLInputElement, File[]>())
  const [section, setSection] = useState<Section>('overview')
  const [data, setData] = useState<any>({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [categories, setCategories] = useState<string[]>([...storefront.categories])
  const [newCategory, setNewCategory] = useState('')
  const [categoryBusy, setCategoryBusy] = useState(false)
  const load = useCallback(
    (url: string, key: string) => {
      const revision = (loadRevision.current[key] ?? 0) + 1
      loadRevision.current[key] = revision
      setLoadStates((current) => ({ ...current, [key]: 'loading' }))
      return queryClient
        .fetchQuery({
          queryKey: privateKey('admin', key, url),
          staleTime: 0,
          gcTime: 0,
          queryFn: async ({ signal }) => {
            const response = await fetch(url, { cache: 'no-store', signal })
            if (!response.ok) throw new Error('Unable to load this section.')
            return response.json()
          },
        })
        .then((body) => {
          if (loadRevision.current[key] !== revision) return
          assertCurrentSession(generation)
          setLoadStates((current) => ({ ...current, [key]: 'ready' }))
          setData((current: any) => ({ ...current, [key]: body }))
        })
        .catch(() => {
          if (generation === sessionGeneration() && loadRevision.current[key] === revision)
            setLoadStates((current) => ({ ...current, [key]: 'error' }))
        })
    },
    [generation],
  )
  useEffect(() => {
    const map: Partial<Record<Section, [string, string]>> = {
      overview: ['/api/admin/analytics', 'analytics'],
      analytics: ['/api/admin/analytics', 'analytics'],
    }
    const item = map[section]
    let active = true
    queueMicrotask(() => {
      if (active && item) void load(...item)
    })
    return () => {
      active = false
    }
  }, [section, load])
  const queryGrid = useCallback((key: 'products' | 'orders' | 'customers', query: DataGridQuery) => {
    const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) })
    if (query.search) params.set('search', query.search)
    if (query.sortBy) {
      params.set('sortBy', query.sortBy)
      params.set('sortDirection', query.sortDirection ?? 'asc')
    }
    for (const [column, value] of Object.entries(query.filters)) params.set(`filter_${column}`, value)
    const url = `/api/admin/${key}?${params.toString()}`
    gridUrls.current[key] = url
    void load(url, key)
  }, [load])
  const onProductsQuery = useCallback((query: DataGridQuery) => queryGrid('products', query), [queryGrid])
  const onOrdersQuery = useCallback((query: DataGridQuery) => queryGrid('orders', query), [queryGrid])
  const onCustomersQuery = useCallback((query: DataGridQuery) => queryGrid('customers', query), [queryGrid])
  useEffect(() => {
    if (section !== 'products') return
    const inputs = Array.from(
      productFormRef.current?.querySelectorAll<HTMLInputElement>('input[type="file"]') ?? [],
    )
    const selected = selectedMedia.current
    selected.clear()
    const onChange = (event: Event) => {
      const input = event.currentTarget as HTMLInputElement
      const previous = selected.get(input) ?? []
      const incoming = Array.from(input.files ?? [])
      const duplicates = incoming.filter((file) =>
        previous.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        ),
      )
      if (duplicates.length)
        notify(
          `Duplicate file${duplicates.length > 1 ? 's' : ''} will not be selected:\n${duplicates.map((file) => file.name).join('\n')}`,
        )
      const merged = [
        ...previous,
        ...incoming.filter(
          (file) =>
            !previous.some(
              (item) =>
                item.name === file.name &&
                item.size === file.size &&
                item.lastModified === file.lastModified,
            ),
        ),
      ]
      selected.set(input, merged)
      const transfer = new DataTransfer()
      merged.forEach((file) => transfer.items.add(file))
      input.files = transfer.files
      const names = [...selected.values()].flat().map((file) => file.name)
      setNotice(names.length ? `Selected media (${names.length}): ${names.join(', ')}` : '')
    }
    inputs.forEach((input) => {
      selected.set(input, Array.from(input.files ?? []))
      input.addEventListener('change', onChange)
    })
    return () => inputs.forEach((input) => input.removeEventListener('change', onChange))
  }, [section, notify, editing?.id])
  const upload = async (file: File) => {
    assertCurrentSession(generation)
    const cached = uploadCache.current.get(file)
    if (cached) return cached
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
    }
    const extension = extensions[file.type]
    const isVideo = file.type.startsWith('video/')
    const maxBytes = isVideo ? 10_000_000 : 6_000_000
    if (!extension) throw new Error('Choose a JPEG, PNG, GIF, WebP, MP4 or WebM file.')
    if (file.size > maxBytes)
      throw new Error(`“${file.name}” is over the ${isVideo ? '10 MB video' : '6 MB image'} limit.`)

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), LONG_RUNNING_API_TIMEOUT_MS)
    try {
      const token = await csrfToken(controller.signal)
      assertCurrentSession(generation)
      const blob = await uploadBlob(`products/${crypto.randomUUID()}.${extension}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
        contentType: file.type,
        multipart: isVideo && file.size > 5_000_000,
        abortSignal: controller.signal,
        headers: { 'X-CSRF-Token': token },
      })
      assertCurrentSession(generation)
      uploadCache.current.set(file, blob.url)
      return blob.url
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new Error('Media upload failed. Check your connection and try the upload again.')
    } finally {
      window.clearTimeout(timeout)
    }
  }
  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newCategory.trim()
    if (!name || categoryLock.current) return
    categoryLock.current = true
    setCategoryBusy(true)
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const body = (await response.json().catch(() => null)) as {
        category?: string
        error?: { message?: string }
      } | null
      if (!response.ok) throw new Error(body?.error?.message ?? 'Unable to add category.')
      if (body?.category) setCategories((current) => [...current, body.category!])
      setNewCategory('')
      notify('Category added successfully.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error : 'Unable to add category.')
    } finally {
      categoryLock.current = false
      setCategoryBusy(false)
    }
  }
  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (actionLock.current) return
    actionLock.current = true
    setBusy(true)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      const imageFiles = form
        .getAll('imageFiles')
        .filter((file): file is File => file instanceof File && file.size > 0)
      const videoFiles = form
        .getAll('videoFiles')
        .filter((file): file is File => file instanceof File && file.size > 0)
      const media = [...imageFiles, ...videoFiles]
      const urls: string[] = []
      for (const [index, file] of media.entries()) {
        setSaveStage(`Uploading ${index + 1} of ${media.length}...`)
        urls.push(await upload(file))
      }
      assertCurrentSession(generation)
      setSaveStage('Saving product...')
      const images = urls.slice(0, imageFiles.length)
      const videos = urls.slice(imageFiles.length)
      const allImages = [...keptImages.map((image) => image.url), ...images]
      const allVideos = [
        ...keptVideos.map((video) => ({ url: video.url, poster: video.poster })),
        ...videos.map((url) => ({ url })),
      ]
      const primaryIndex = Math.max(
        0,
        Math.min(Number(form.get('primaryImage') ?? 1) - 1, allImages.length - 1),
      )
      const orderedImages = allImages.map((url, index) => ({
        url,
        isPrimary: index === primaryIndex,
        sortOrder: index === primaryIndex ? 0 : index + 1,
      }))
      const colors = lines(form.get('colors')).map((value) => {
        const [rawName, rawHex] = value.split('|')
        const name = rawName.trim()
        const candidate = rawHex?.trim() || name.toLowerCase()
        if (!CSS.supports('color', candidate))
          throw new Error(`Enter a valid color or hex value for ${name}.`)
        const context = document.createElement('canvas').getContext('2d')!
        context.fillStyle = candidate
        const hex = context.fillStyle
        if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Use a six-digit hex value for ${name}.`)
        return { name, hex }
      })
      const payload = {
        name: String(form.get('name') ?? ''),
        category: String(form.get('category') ?? ''),
        description: String(form.get('description') ?? ''),
        priceMinor: Number(form.get('price')) * 100,
        shippingFeeMinor: 0,
        compareAtPriceMinor: form.get('compareAtPrice') ? Math.round(Number(form.get('compareAtPrice')) * 100) : null,
        stock: Number(form.get('stock')),
        colors,
        images: orderedImages,
        videos: allVideos.map((video, index) => ({ ...video, sortOrder: index })),
      }
      const response = await fetch(
        editing ? `/api/admin/products/${editing.id}` : '/api/admin/products',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as {
          error?: { message?: string }
        } | null
        throw new Error(failure?.error?.message ?? 'Product could not be saved. Please try again.')
      }
      await response.json()
      void load(gridUrls.current.products, 'products')
      formElement.reset()
      setNotice('')
      setEditing(null)
      setProductOpen(false)
      setKeptImages([])
      setKeptVideos([])
      notify(editing ? 'Product updated successfully.' : 'Product saved successfully.', 'success')
    } catch (error) {
      notify(
        error instanceof Error && error.message !== 'upload'
          ? error
          : 'Product or media upload failed. Please try again.',
      )
    } finally {
      actionLock.current = false
      setBusy(false)
    }
  }
  const patch = async (url: string, body: object, message: string) => {
    if (actionLock.current) return
    actionLock.current = true
    setBusy(true)
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: { message?: string }
        } | null
        throw new Error(result?.error?.message ?? 'Update failed. Please refresh and try again.')
      }
      await response.json()
      if (url.startsWith('/api/admin/products/')) void load(gridUrls.current.products, 'products')
      if (url === '/api/admin/orders') void load(gridUrls.current.orders, 'orders')
      notify(message, 'success')
    } catch (error) {
      notify(error instanceof Error ? error : 'Update failed. Please try again.')
    } finally {
      actionLock.current = false
      setBusy(false)
    }
  }
  const moneyField = (
    product: AdminProduct,
    field: 'priceMinor' | 'compareAtPriceMinor',
    label: string,
    value: number | null | undefined,
    nullable = false,
  ) => (
    <div className="relative w-32">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]" aria-hidden="true">₹</span>
      <input
        key={`${product.id}-${field}-${value ?? 'unset'}`}
        aria-label={`${label} for ${product.name}`}
        className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] py-2 pl-7 pr-2 text-sm tabular-nums text-[var(--ink)] focus-visible:border-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:opacity-60"
        type="number"
        min="0"
        max={21474836.47}
        step="0.01"
        required={!nullable}
        placeholder={nullable ? 'Not set' : '0.00'}
        defaultValue={value == null ? '' : (value / 100).toFixed(2)}
        disabled={busy}
        onBlur={(event) => {
          const input = event.currentTarget
          if (!input.checkValidity()) {
            input.reportValidity()
            return
          }
          const rawValue = input.value.trim()
          const nextValue = rawValue === '' && nullable ? null : Math.round(Number(rawValue) * 100)
          if (nextValue === value) return
          void patch(`/api/admin/products/${product.id}`, { [field]: nextValue }, `${label} updated.`)
        }}
      />
    </div>
  )
  const analytics = data.analytics ?? {}
  const products = data.products?.products ?? []
  const orders = data.orders?.orders ?? []
  const customers = data.customers?.customers ?? []
  const productCategoryOptions = [...new Set<string>(categories)]
    .sort((left, right) => left.localeCompare(right))
    .map((category) => ({ value: category, label: category }))
  const customerRoleOptions = [
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'ADMIN', label: 'Administrator' },
  ]
  const activeKey = section === 'overview' ? 'analytics' : section
  return (
    <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, sm: 5, lg: 6 } }}>
      <Stack component="header" direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', pb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Administration</Typography>
          <Typography component="h1" variant="h3" sx={{ fontWeight: 600, letterSpacing: '-.03em' }}>Gadgify control center</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>Manage products, orders, customer care, and store operations.</Typography>
        </Box>
        <Button component="a" variant="outlined" href="/" onClick={onNavigate('/')}>View storefront</Button>
      </Stack>
      <Stack spacing={2}>
        <Box component="nav" aria-label="Admin sections" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', sm: 'repeat(4,minmax(0,1fr))', lg: 'repeat(7,minmax(0,1fr))' }, gap: 1 }}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={section === tab.id ? 'contained' : 'outlined'}
              type="button"
              aria-pressed={section === tab.id}
              disabled={busy}
              onClick={() => {
                beginEdit(null)
                setSection(tab.id)
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>
        <Stack component="nav" aria-label="Additional admin tools" direction="row" spacing={1} sx={{ flexWrap: 'wrap', pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          {([['/admin/fulfillment', 'Shop fulfillment'], ['/admin/sellers', 'Seller applications'], ['/admin/seller-products', 'Seller products'], ['/admin/support', 'Support inbox']] as const).map(([path, label]) => <Button key={path} component="a" variant="text" href={path} onClick={onNavigate(path)}>{label}</Button>)}
        </Stack>
      </Stack>
      <Box sx={{ minWidth: 0 }} aria-busy={loadStates[activeKey] === 'loading'}>
          {loadStates[activeKey] === 'loading' && !['products', 'orders', 'customers'].includes(activeKey) && (
            <div className="flex min-h-32 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-6 text-sm text-[var(--muted)]" role="status" aria-live="polite">
              <span className="size-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--ink)] motion-reduce:animate-none" aria-hidden="true" />
              <span>Loading {section === 'overview' ? 'overview' : section}…</span>
            </div>
          )}
          {loadStates[activeKey] === 'error' && (
            <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="m-0 text-base font-semibold text-[var(--ink)]">This section could not be loaded</h2>
                <p className="mb-0 mt-1 text-sm leading-6 text-[var(--muted)]">Check your connection and try again. Your changes have not been submitted.</p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  const gridKey = activeKey as keyof typeof gridUrls.current
                  void load(gridKey in gridUrls.current ? gridUrls.current[gridKey] : `/api/admin/${activeKey}`, activeKey)
                }}
              >
                Try again
              </button>
            </div>
          )}
          <div
            hidden={
              !['products', 'orders', 'customers', 'payments', 'messages', 'settings', 'returns', 'feedback', 'policies', 'coupons', 'shipments', 'notifications'].includes(
                activeKey,
              ) && loadStates[activeKey] !== 'ready'
            }
          >
            {notice && (
              <p className="admin-feedback admin-feedback-top" role="status">
                {notice}
              </p>
            )}
            {section === 'overview' && (
              <>
                <Stats data={analytics} />
                <Panel text="Create products, monitor orders, process refunds, message customers, and configure settings from this workspace." />
              </>
            )}
            {section === 'products' && (
              <>
                <Title
                  title={editing ? `Edit ${editing.name}` : 'Products & inventory'}
                  text={
                    editing
                      ? 'Update product details and media, then save your changes.'
                      : 'Create products with stock, colors, images, and videos. Delivery is free at launch.'
                  }
                />
                <Button variant="contained" disabled={busy} onClick={() => { beginEdit(null); setProductOpen(true) }}>Add product</Button>
                <FormDialog open={productOpen} title={editing ? 'Edit product' : 'Add product'} busy={busy || categoryBusy} onClose={() => setProductOpen(false)}>
                <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} onSubmit={addCategory} sx={{ mb: 2.5, alignItems: { sm: 'flex-end' } }}>
                    <TextField id="new-category" label="Add category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Category name" slotProps={{ htmlInput: { maxLength: 80 } }} disabled={categoryBusy || busy} />
                    <Button variant="outlined" type="submit" disabled={categoryBusy || busy || !newCategory.trim()}>
                      {categoryBusy ? 'Adding…' : 'Add category'}
                    </Button>
                </Stack>
                <form
                  key={editing?.id ?? 'new'}
                  ref={productFormRef}
                  className="admin-form"
                  onSubmit={saveProduct}
                  onReset={() => {
                    selectedMedia.current.clear()
                    setNotice('')
                  }}
                >
                  <label>
                    Product name
                    <input
                      disabled={busy}
                      name="name"
                      defaultValue={editing?.name ?? ''}
                      required
                    />
                  </label>
                  <label>
                    Category
                    <select
                      disabled={busy}
                      name="category"
                      defaultValue={editing?.category ?? ''}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Price (₹)
                    <input
                      disabled={busy}
                      name="price"
                      defaultValue={editing ? editing.priceMinor / 100 : ''}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                    />
                  </label>
                  
                  <label>
                    Original price (optional)
                    <input
                      disabled={busy}
                      name="compareAtPrice"
                      defaultValue={editing?.compareAtPriceMinor ? editing.compareAtPriceMinor / 100 : ''}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                    <small>Shown crossed out when higher than the selling price.</small>
                  </label>
                  <label>
                    Stock
                    <input
                      disabled={busy}
                      name="stock"
                      defaultValue={editing?.stock ?? ''}
                      type="number"
                      min="0"
                      required
                    />
                  </label>
                  <label className="full">
                    Description
                    <textarea
                      disabled={busy}
                      name="description"
                      defaultValue={editing?.description ?? ''}
                      rows={4}
                    />
                  </label>
                  <label className="full">
                    Colors
                    <textarea
                      disabled={busy}
                      name="colors"
                      defaultValue={
                        editing?.colors?.map((color) => `${color.name}|${color.hex}`).join('\n') ??
                        ''
                      }
                      rows={3}
                      placeholder={'Black|#111111\nNatural|#d8c29d'}
                    />
                    <small>
                      One per line: Red or Red|#ff0000. Custom shades require a hex value.
                    </small>
                  </label>
                  {editing && (
                    <div className="full admin-existing-media">
                      <h3>Current photos and videos</h3>
                      <p>
                        Kept photos come first, followed by new uploads. Choose the primary image
                        number from that order.
                      </p>
                      {keptImages.map((image, index) => (
                        <div key={image.url}>
                          <img src={image.url} alt={`Image ${index + 1}`} />
                          <span>Image {index + 1}</span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setKeptImages((current) => current.filter((_, i) => i !== index))
                            }
                          >
                            Remove image
                          </button>
                        </div>
                      ))}
                      {keptVideos.map((video, index) => (
                        <div key={video.url}>
                          <video src={video.url} controls preload="metadata" />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setKeptVideos((current) => current.filter((_, i) => i !== index))
                            }
                          >
                            Remove video
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="full">
                    Product images
                    <input
                      disabled={busy}
                      name="imageFiles"
                      type="file"
                      accept="image/*"
                      multiple
                    />
                    <small>Multiple files supported. The primary image is selected below.</small>
                  </label>
                  <label>
                    Primary image number
                    <input
                      disabled={busy}
                      name="primaryImage"
                      type="number"
                      min="1"
                      defaultValue="1"
                    />
                    <small>1 = first selected image</small>
                  </label>
                  <label className="full">
                    Product videos
                    <input
                      disabled={busy}
                      name="videoFiles"
                      type="file"
                      accept="video/mp4,video/webm"
                      multiple
                    />
                    <small>MP4 or WebM, up to 10 MB per video. Images support up to 6 MB each.</small>
                  </label>
                  <button className="primary-button" type="submit" disabled={busy}>
                    {busy ? saveStage : editing ? 'Save changes' : 'Save product'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={busy}
                      onClick={() => beginEdit(null)}
                    >
                      Cancel editing
                    </button>
                  )}
                </form>
                </FormDialog>
                <DataGrid
                  rows={products as AdminProduct[]}
                  totalRows={data.products?.pagination?.total ?? 0}
                  isLoading={loadStates.products === 'loading'}
                  onQueryChange={onProductsQuery}
                  label="Products"
                  emptyMessage="No products have been created yet."
                  getRowKey={(product) => product.id}
                  columns={[
                    {
                      id: 'product',
                      header: 'Product',
                      sortKey: 'name',
                      getFilterValue: (product) => product.name,
                      getSortValue: (product) => product.name,
                      minWidthClass: 'min-w-64',
                      cell: (product) => <div className="flex min-w-56 items-center gap-3"><span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--muted)]">{product.images?.[0]?.url ? <img src={product.images[0].url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.hidden = true }} /> : <ImageIcon className="size-5" aria-hidden="true" />}</span><span className="font-medium leading-5 text-[var(--ink)]">{product.name}</span></div>,
                    },
                    {
                      id: 'category',
                      header: 'Category',
                      getFilterValue: (product) => product.category,
                      getSortValue: (product) => product.category,
                      filterOptions: productCategoryOptions,
                      minWidthClass: 'min-w-40',
                      cell: (product) => product.category,
                    },
                    {
                      id: 'price',
                      header: 'Price',
                      sortKey: 'priceMinor',
                      getFilterValue: (product) => (product.priceMinor / 100).toLocaleString('en-IN'),
                      getSortValue: (product) => product.priceMinor,
                      filterType: 'number', filterStep: 0.01, minWidthClass: 'min-w-28',
                      cell: (product) => moneyField(product, 'priceMinor', 'Price', product.priceMinor),
                    },
                    {
                      id: 'originalPrice',
                      header: 'Original price',
                      sortKey: 'compareAtPriceMinor',
                      getFilterValue: (product) => product.compareAtPriceMinor == null ? '' : (product.compareAtPriceMinor / 100).toFixed(2),
                      getSortValue: (product) => product.compareAtPriceMinor ?? -1,
                      filterType: 'number', filterStep: 0.01, minWidthClass: 'min-w-36',
                      cell: (product) => moneyField(product, 'compareAtPriceMinor', 'Original price', product.compareAtPriceMinor, true),
                    },
                    {
                      id: 'stock',
                      header: 'Stock',
                      getFilterValue: (product) => product.stock,
                      getSortValue: (product) => product.stock,
                      filterType: 'number', filterStep: 1, minWidthClass: 'min-w-28',
                      cell: (product) => <input key={product.stock} aria-label={`Stock for ${product.name}`} disabled={busy} className="admin-inline-input min-h-11 w-24 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-base text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]" type="number" min="0" defaultValue={product.stock} onBlur={(event) => {
                        if (Number(event.target.value) !== product.stock) void patch(`/api/admin/products/${product.id}`, { stock: Number(event.target.value) }, 'Stock updated.')
                      }} />,
                    },
                    {
                      id: 'visibility',
                      header: 'Visibility',
                      sortKey: 'isActive',
                      getFilterValue: (product) => product.isActive ? 'published' : 'archived',
                      filterOptions: [{ value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }],
                      getSortValue: (product) => product.isActive ? 'Published' : 'Archived',
                      cell: (product) => <div className="relative w-32"><select key={`${product.id}-${product.isActive}`} aria-label={`Visibility for ${product.name}`} className="min-h-11 w-full appearance-none rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 pr-8 text-sm font-medium text-[var(--ink)] focus-visible:border-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:opacity-60" defaultValue={product.isActive ? 'published' : 'archived'} disabled={busy} onChange={(event) => patch(`/api/admin/products/${product.id}`, { isActive: event.target.value === 'published' }, 'Visibility updated.')}><option value="published">Published</option><option value="archived">Archived</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" /></div>,
                    },
                    {
                      id: 'actions',
                      header: 'Actions',
                      filterable: false,
                      minWidthClass: 'min-w-28',
                      cell: (product) => <div className="flex items-center gap-2"><button className="inline-flex size-10 appearance-none items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-50" aria-label={`Edit ${product.name}`} title="Edit product" disabled={busy} onClick={() => { beginEdit(product); setProductOpen(true) }}><Pencil className="size-4" aria-hidden="true" /></button><button className="inline-flex size-10 appearance-none items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-50" aria-label={`${product.isActive ? 'Archive' : 'Publish'} ${product.name}`} title={product.isActive ? 'Archive product' : 'Publish product'} disabled={busy} onClick={() => patch(`/api/admin/products/${product.id}`, { isActive: !product.isActive }, 'Visibility updated.')}>{product.isActive ? <Archive className="size-4" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}</button></div>,
                    },
                  ]}
                />
              </>
            )}
            {section === 'orders' && (
              <>
                <Title title="Orders" text="Review orders and update fulfillment status." />
                <DataGrid
                  rows={orders}
                  totalRows={data.orders?.pagination?.total ?? 0}
                  isLoading={loadStates.orders === 'loading'}
                  onQueryChange={onOrdersQuery}
                  label="Orders"
                  emptyMessage="No orders have been placed yet."
                  getRowKey={(order: any) => order.id}
                  columns={[
                    { id: 'order', header: 'Order', sortKey: 'orderNumber', getFilterValue: (order: any) => order.orderNumber, getSortValue: (order: any) => order.orderNumber, cell: (order: any) => <span className="whitespace-nowrap font-medium">{order.orderNumber}</span> },
                    { id: 'total', header: 'Total', sortKey: 'totalMinor', getFilterValue: (order: any) => (order.totalMinor / 100).toLocaleString('en-IN'), getSortValue: (order: any) => order.totalMinor, filterType: 'number', filterStep: 0.01, cell: (order: any) => `₹${(order.totalMinor / 100).toLocaleString('en-IN')}` },
                    {
                      id: 'status',
                      header: 'Status',
                      getFilterValue: (order: any) => order.status,
                      filterOptions: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => ({ value: status, label: status })),
                      getSortValue: (order: any) => order.status,
                      cell: (order: any) => <div className="relative w-fit"><select aria-label={`Status for order ${order.orderNumber}`} className="min-h-11 appearance-none rounded-lg border border-[var(--line)] bg-[var(--paper)] py-2 pl-3 pr-9 text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || ['CANCELLED', 'REFUNDED', 'SHIPPED', 'DELIVERED'].includes(order.status)} value={order.status} onChange={(event) => patch('/api/admin/orders', { orderId: order.id, status: event.target.value }, 'Order updated.')}>
                        <option>PENDING</option><option>CONFIRMED</option><option>PROCESSING</option><option disabled>SHIPPED</option><option disabled>DELIVERED</option><option disabled={order.status !== 'PENDING' && order.status !== 'CONFIRMED'}>CANCELLED</option><option disabled>REFUNDED</option>
                      </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" /></div>,
                    },
                    { id: 'actions', header: 'Actions', filterable: false, cell: () => <button className="secondary-button min-h-11" type="button" onClick={() => setSection('shipments')}>Manage shipment</button> },
                  ]}
                />
              </>
            )}
            {section === 'payments' && (
              <>
                <Title title="Payments" text="Manage full refunds and verify provider status." />
                <PaymentRefunds />
              </>
            )}
            {section === 'returns' && (
              <>
                <Title title="Returns & refunds" text="Review customer return requests." />
                <ReturnRequests />
              </>
            )}
            {section === 'customers' && (
              <>
                <Title title="Customer and administrator accounts" text="Review account access roles and customer order history. Roles are assigned by the server and are not inferred from names or email addresses." />
                <DataGrid
                  rows={customers}
                  totalRows={data.customers?.pagination?.total ?? 0}
                  isLoading={loadStates.customers === 'loading'}
                  onQueryChange={onCustomersQuery}
                  label="Customers"
                  emptyMessage="No customer records yet."
                  getRowKey={(customer: any) => customer.id}
                  columns={[
                    { id: 'name', header: 'Name', getFilterValue: (customer: any) => customer.name, getSortValue: (customer: any) => customer.name, cell: (customer: any) => customer.name ?? '—' },
                    { id: 'email', header: 'Email', getFilterValue: (customer: any) => customer.email, getSortValue: (customer: any) => customer.email, cell: (customer: any) => customer.email ?? '—' },
                    { id: 'role', header: 'Account role', getFilterValue: (customer: any) => customer.role, getSortValue: (customer: any) => customer.role, filterOptions: customerRoleOptions, cell: (customer: any) => <Chip size="small" color={customer.role === 'ADMIN' ? 'success' : 'default'} variant={customer.role === 'ADMIN' ? 'filled' : 'outlined'} label={customer.role === 'ADMIN' ? 'Administrator' : 'Customer'} /> },
                    { id: 'orders', header: 'Orders', getFilterValue: (customer: any) => customer._count.orders, getSortValue: (customer: any) => customer._count.orders, cell: (customer: any) => customer._count.orders },
                  ]}
                />
              </>
            )}
            {section === 'messages' && (
              <>
                <Title title="Customer messages" text="Send support and order update emails." />
                <CustomerMessages />
              </>
            )}
            {section === 'analytics' && (
              <>
                <Title title="Analytics" text="Store performance from live database records." />
                <Stats data={analytics} />
              </>
            )}
            {section === 'settings' && (
              <>
                <Title
                  title="Store settings"
                  text="Configure branding, currency, locale, and announcements."
                />
                <CheckoutSettings />
              </>
            )}
            {section === 'feedback' && (
              <>
                <Title
                  title="Purchase feedback"
                  text="Review private first-purchase experience feedback."
                />
                <AdminFeedback />
              </>
            )}
            {section === 'policies' && (
              <>
                <Title
                  title="Policies"
                  text="Save drafts and explicitly publish approved business policies."
                />
                <PolicyEditor />
              </>
            )}
            {section === 'coupons' && (
              <>
                <Title title="Coupons" text="Configure discount drafts, dates and limits." />
                <CouponManager />
              </>
            )}
            {section === 'shipments' && <><Title title="Shipments" text="Record dispatch, tracking and delivery updates." /><ShipmentManager /></>}
            {section === 'notifications' && <><Title title="Notifications" text="Review order and delivery email attempts." /><NotificationHistory /></>}
          </div>
      </Box>
    </Stack>
  )
}

function lines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}
function Stats({ data }: { data: any }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' }, gap: 2, mb: 3 }}>
      <Stat
        label="Revenue"
        value={`₹${((data.revenueMinor ?? 0) / 100).toLocaleString('en-IN')}`}
      />
      <Stat label="Orders" value={data.orders ?? 0} />
      <Stat label="Customers" value={data.customers ?? 0} />
      <Stat label="Products" value={data.products ?? 0} />
    </Box>
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, display: 'grid', gap: 0.75 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h5" component="strong" sx={{ fontWeight: 700 }}>{value}</Typography></Card>
}
function Title({ title, text }: { title: string; text: string }) {
  return <Stack spacing={0.5} sx={{ mb: 2 }}><Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>ADMIN</Typography><Typography component="h2" variant="h4" sx={{ fontWeight: 600, letterSpacing: '-.03em' }}>{title}</Typography><Typography color="text.secondary">{text}</Typography></Stack>
}
function Panel({ text }: { text: string }) {
  return <Card variant="outlined" sx={{ mt: 2, p: { xs: 2, sm: 3 } }}><Typography color="text.secondary">{text}</Typography></Card>
}
