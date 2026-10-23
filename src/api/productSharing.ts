export function productPublicUrl(productId: string) {
  return new URL(`/product/${encodeURIComponent(productId)}`, window.location.origin).toString()
}

export async function copyProductLink(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return true
    }
  } catch {
    // Continue to the browser fallback where clipboard permissions are unavailable.
  }

  const field = document.createElement('textarea')
  field.value = url
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  try {
    return document.execCommand('copy')
  } finally {
    field.remove()
  }
}

export async function shareProductLink(product: { id: string; name: string }) {
  const url = productPublicUrl(product.id)
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: product.name, text: `${product.name} on Gadgify`, url })
      return 'shared' as const
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled' as const
      // A failed native share falls back to copying the public link.
    }
  }
  return (await copyProductLink(url)) ? 'copied' as const : 'failed' as const
}

export function facebookProductShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}