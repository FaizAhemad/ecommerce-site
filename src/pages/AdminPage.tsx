import { privateKey, sessionGeneration, assertCurrentSession } from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { CheckoutSettings } from '../components/CheckoutSettings'
import { CustomerMessages } from '../components/CustomerMessages'
import { apiFetch as fetch, LONG_RUNNING_API_TIMEOUT_MS } from '../api/http'
import { queryClient } from '../api/queryClient'
import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
type AdminProduct = {
  id: string
  name: string
  category: string
  priceMinor: number
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
  const [keptImages, setKeptImages] = useState<NonNullable<AdminProduct['images']>>([])
  const [keptVideos, setKeptVideos] = useState<NonNullable<AdminProduct['videos']>>([])
  const beginEdit = (product: AdminProduct | null) => {
    productFormRef.current?.reset()
    setEditing(product)
    setKeptImages([...(product?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder))
    setKeptVideos([...(product?.videos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder))
    productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const createdProducts = useRef(new Map<string, AdminProduct>())
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
      setLoadStates((current) => ({ ...current, [key]: 'loading' }))
      return queryClient
        .fetchQuery({
          queryKey: privateKey('admin', key),
          staleTime: 0,
          gcTime: 0,
          queryFn: async ({ signal }) => {
            const response = await fetch(url, { cache: 'no-store', signal })
            if (!response.ok) throw new Error('Unable to load this section.')
            return response.json()
          },
        })
        .then((body) => {
          assertCurrentSession(generation)
          setLoadStates((current) => ({ ...current, [key]: 'ready' }))
          setData((current: any) => {
            if (key !== 'products') return { ...current, [key]: body }
            const products: AdminProduct[] = body.products ?? []
            const serverIds = new Set(products.map((product) => product.id))
            // Preserve confirmed creations that an earlier list snapshot does not contain.
            const missing = [...createdProducts.current.values()]
              .reverse()
              .filter((product) => !serverIds.has(product.id))
            return {
              ...current,
              products: {
                ...body,
                products: [
                  ...missing,
                  ...products.map((product) => createdProducts.current.get(product.id) ?? product),
                ],
              },
            }
          })
        })
        .catch(() => {
          if (generation === sessionGeneration())
            setLoadStates((current) => ({ ...current, [key]: 'error' }))
        })
    },
    [generation],
  )
  useEffect(() => {
    const map: Partial<Record<Section, [string, string]>> = {
      overview: ['/api/admin/analytics', 'analytics'],
      analytics: ['/api/admin/analytics', 'analytics'],
      products: ['/api/admin/products', 'products'],
      orders: ['/api/admin/orders', 'orders'],
      payments: ['/api/admin/payments', 'payments'],
      returns: ['/api/admin/returns', 'returns'],
      customers: ['/api/admin/customers', 'customers'],
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
    const encoded = await fileToDataUrl(file)
    assertCurrentSession(generation)
    const response = await fetch('/api/admin/upload', {
      timeoutMs: LONG_RUNNING_API_TIMEOUT_MS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encoded, filename: file.name, contentType: file.type }),
    })
    if (!response.ok) throw new Error('upload')
    const url = ((await response.json()) as { url: string }).url
    uploadCache.current.set(file, url)
    return url
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
      const result = (await response.json()) as { product: AdminProduct }
      createdProducts.current.set(result.product.id, result.product)
      setData((current: any) => ({
        ...current,
        products: {
          ...current.products,
          products: [
            result.product,
            ...(current.products?.products ?? []).filter(
              (product: AdminProduct) => product.id !== result.product.id,
            ),
          ],
        },
      }))
      formElement.reset()
      setNotice('')
      setEditing(null)
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
      if (response.ok && url.startsWith('/api/admin/products/')) {
        const result = (await response.json()) as { product: AdminProduct }
        createdProducts.current.set(result.product.id, result.product)
        setData((current: any) => ({
          ...current,
          products: {
            ...current.products,
            products: current.products.products.map((product: AdminProduct) =>
              product.id === result.product.id ? result.product : product,
            ),
          },
        }))
      }
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: { message?: string }
        } | null
        throw new Error(result?.error?.message ?? 'Update failed. Please refresh and try again.')
      }
      if (url === '/api/admin/orders') {
        const result = (await response.json()) as { order: { id: string; status: string } }
        setData((current: any) => ({
          ...current,
          orders: {
            ...current.orders,
            orders: current.orders.orders.map((order: { id: string }) =>
              order.id === result.order.id ? { ...order, ...result.order } : order,
            ),
          },
        }))
      }
      notify(message, 'success')
    } catch (error) {
      notify(error instanceof Error ? error : 'Update failed. Please try again.')
    } finally {
      actionLock.current = false
      setBusy(false)
    }
  }
  const analytics = data.analytics ?? {}
  const products = data.products?.products ?? []
  const orders = data.orders?.orders ?? []
  const payments = data.payments?.payments ?? []
  const customers = data.customers?.customers ?? []
  const activeKey = section === 'overview' ? 'analytics' : section
  return (
    <section className="admin-page page-section">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Gadgify control center</h1>
          <p className="hero-text">Manage your store from one workspace.</p>
        </div>
        <a className="secondary-button" href="/" onClick={onNavigate('/')}>
          View storefront
        </a>
      </div>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={section === tab.id ? 'is-active' : ''}
              type="button"
              disabled={busy}
              onClick={() => {
                beginEdit(null)
                setSection(tab.id)
              }}
            >
              {tab.label}
            </button>
          ))}
        </aside>
        <div className="admin-content" aria-busy={loadStates[activeKey] === 'loading'}>
          {loadStates[activeKey] === 'loading' && <p role="status">Loading this section?</p>}
          {loadStates[activeKey] === 'error' && (
            <div role="alert" className="state-panel">
              <p>Unable to load this section. Please retry.</p>
              <button
                className="secondary-button"
                onClick={() => void load(`/api/admin/${activeKey}`, activeKey)}
              >
                Try again
              </button>
            </div>
          )}
          <div hidden={activeKey !== 'messages' && loadStates[activeKey] !== 'ready'}>
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
                      : 'Create products with stock, colors, images, and videos.'
                  }
                />
                <form className="category-manager" onSubmit={addCategory}>
                  <label htmlFor="new-category">Add category</label>
                  <div>
                    <input
                      id="new-category"
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      placeholder="Category name"
                      maxLength={80}
                      disabled={categoryBusy || busy}
                    />
                    <button
                      className="secondary-button"
                      type="submit"
                      disabled={categoryBusy || busy || !newCategory.trim()}
                    >
                      {categoryBusy ? 'Adding…' : 'Add category'}
                    </button>
                  </div>
                </form>
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
                      accept="video/*"
                      multiple
                    />
                    <small>Multiple files supported.</small>
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
                {products.length ? (
                  <Table>
                    <table className="admin-table">
                      <tbody>
                        {products.map((product: any) => (
                          <tr key={product.id}>
                            <td>
                              {product.name}
                              <small>{product.category}</small>
                            </td>
                            <td>₹{(product.priceMinor / 100).toLocaleString('en-IN')}</td>
                            <td>
                              <input
                                key={product.stock}
                                disabled={busy}
                                className="admin-inline-input"
                                type="number"
                                min="0"
                                defaultValue={product.stock}
                                onBlur={(event) => {
                                  if (Number(event.target.value) !== product.stock)
                                    void patch(
                                      `/api/admin/products/${product.id}`,
                                      { stock: Number(event.target.value) },
                                      'Stock updated.',
                                    )
                                }}
                              />
                            </td>
                            <td>
                              <button
                                className="admin-text-button"
                                disabled={busy}
                                onClick={() => beginEdit(product)}
                              >
                                Edit
                              </button>
                              <button
                                className="admin-text-button"
                                disabled={busy}
                                onClick={() =>
                                  patch(
                                    `/api/admin/products/${product.id}`,
                                    { isActive: !product.isActive },
                                    'Visibility updated.',
                                  )
                                }
                              >
                                {product.isActive ? 'Archive' : 'Publish'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Table>
                ) : (
                  <Empty text="No products have been created yet." />
                )}
              </>
            )}
            {section === 'orders' && (
              <>
                <Title title="Orders" text="Review orders and update fulfillment status." />
                {orders.length ? (
                  <Table>
                    <table className="admin-table">
                      <tbody>
                        {orders.map((o: any) => (
                          <tr key={o.id}>
                            <td>{o.orderNumber}</td>
                            <td>₹{(o.totalMinor / 100).toLocaleString('en-IN')}</td>
                            <td>
                              <select
                                disabled={
                                  busy || o.status === 'CANCELLED' || o.status === 'REFUNDED'
                                }
                                value={o.status}
                                onChange={(e) =>
                                  patch(
                                    '/api/admin/orders',
                                    { orderId: o.id, status: e.target.value },
                                    'Order updated.',
                                  )
                                }
                              >
                                <option>PENDING</option>
                                <option>CONFIRMED</option>
                                <option>PROCESSING</option>
                                <option>SHIPPED</option>
                                <option>DELIVERED</option>
                                <option
                                  disabled={o.status !== 'PENDING' && o.status !== 'CONFIRMED'}
                                >
                                  CANCELLED
                                </option>
                                <option disabled>REFUNDED</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Table>
                ) : (
                  <Empty text="No orders have been placed yet." />
                )}
              </>
            )}
            {section === 'payments' && (
              <>
                <Title title="Payments" text="Monitor payments and verify provider refunds." />
                <p>
                  Process approved refunds through Razorpay, then verify their recorded status here.
                  Verification does not issue a refund. Partial refunds and automated refund
                  requests are not available yet.
                </p>
                {payments.length ? (
                  <Table>
                    <table className="admin-table">
                      <tbody>
                        {payments.map((p: any) => (
                          <tr key={p.id}>
                            <td>{p.order.orderNumber}</td>
                            <td>₹{(p.amountMinor / 100).toLocaleString('en-IN')}</td>
                            <td>{p.status}</td>
                            <td>
                              {p.provider === 'RAZORPAY' && p.providerPaymentId && (
                                <button
                                  className="admin-text-button danger"
                                  disabled={busy}
                                  onClick={() =>
                                    patch(
                                      '/api/admin/payments',
                                      { orderId: p.orderId, action: 'reconcile-refund' },
                                      'Provider full refund verified.',
                                    )
                                  }
                                >
                                  Verify refund
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Table>
                ) : (
                  <Empty text="No payment records yet." />
                )}
              </>
            )}
            {section === 'returns' && (
              <>
                <Title title="Returns & refunds" text="Review customer return requests." />
                <Empty text="No return requests yet." />
              </>
            )}
            {section === 'customers' && (
              <>
                <Title title="Customers" text="Review customer accounts and order history." />
                {customers.length ? (
                  <Table>
                    <table className="admin-table">
                      <tbody>
                        {customers.map((c: any) => (
                          <tr key={c.id}>
                            <td>{c.name ?? '—'}</td>
                            <td>{c.email ?? '—'}</td>
                            <td>{c.role}</td>
                            <td>{c._count.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Table>
                ) : (
                  <Empty text="No customer records yet." />
                )}
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
          </div>
        </div>
      </div>
    </section>
  )
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
function lines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}
function Stats({ data }: { data: any }) {
  return (
    <div className="admin-stat-grid">
      <Stat
        label="Revenue"
        value={`₹${((data.revenueMinor ?? 0) / 100).toLocaleString('en-IN')}`}
      />
      <Stat label="Orders" value={data.orders ?? 0} />
      <Stat label="Customers" value={data.customers ?? 0} />
      <Stat label="Products" value={data.products ?? 0} />
    </div>
  )
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
function Title({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-section-title">
      <div>
        <p className="eyebrow">ADMIN</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  )
}
function Panel({ text }: { text: string }) {
  return (
    <div className="admin-panel">
      <p>{text}</p>
    </div>
  )
}
function Table({ children }: { children: any }) {
  return <div className="admin-table-wrap">{children}</div>
}
function Empty({ text }: { text: string }) {
  return (
    <div className="admin-empty">
      <p>{text}</p>
    </div>
  )
}
