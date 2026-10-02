import { copyFile, mkdir, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { digest, productFields, safeName } from './core.mjs'

export function groupProducts(rows) {
  const products = new Map(), assigned = new Map(), review = new Map()
  const byId = new Map(rows.map((row) => [row.id, row]))
  for (const row of rows) {
    const fields = productFields(row.message.text)
    if (fields.issue) { review.set(row.id, fields.issue); continue }
    if (!fields.product) continue
    const id = digest(`${row.vendor}\0${fields.code ? `code:${fields.code}` : `message:${row.id}`}`).slice(0, 16)
    if (products.has(id)) {
      review.set(row.id, 'This product code already exists. Review the new message as a possible update.')
      continue
    }
    products.set(id, { id, fields, messages: [row], media: [], source: row.message })
    assigned.set(row.id, id)
  }
  // Resolve reply chains, including a photo that arrived before its parent text.
  for (let pass = 0; pass < Math.min(rows.length, 32); pass++) {
    let changed = false
    for (const row of rows) {
      if (assigned.has(row.id) || review.has(row.id)) continue
      const fields = productFields(row.message.text)
      const parent = byId.get(row.message.replyTo)
      const parentId = parent?.vendor === row.vendor ? assigned.get(parent.id) : undefined
      const codeId = fields.code ? digest(`${row.vendor}\0code:${fields.code}`).slice(0, 16) : undefined
      if (parentId && codeId && parentId !== codeId) { review.set(row.id, 'Reply and product code refer to different products.'); continue }
      const product = products.get(parentId ?? codeId)
      if (!product || product.source.vendorId !== row.vendor) continue
      if (Object.keys(fields).some((key) => key !== 'code')) { review.set(row.id, 'Additional product details need review before changing the original record.'); continue }
      assigned.set(row.id, product.id); product.messages.push(row); changed = true
    }
    if (!changed) break
  }
  for (const row of rows) {
    if (!assigned.has(row.id) && !review.has(row.id)) review.set(row.id, 'No explicit product name, matching code or product reply. Needs grouping review.')
  }
  return { products: [...products.values()], review }
}

function addSheet(book, name, headers, data) {
  const sheet = book.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = headers.map((header) => ({ header, width: /description|text|files|reason/i.test(header) ? 48 : 24 }))
  for (const values of data) sheet.addRow(values.map((value) => typeof value === 'string' ? value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '') : value))
  sheet.getRow(1).height = 30
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006D77' } }
  })
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, data.length + 1), column: headers.length } }
  sheet.eachRow((row, index) => { if (index > 1) { row.height = 48; row.alignment = { vertical: 'top', wrapText: true } } })
  return sheet
}

export async function exportVendor(root, vendor, allRows) {
  const rows = allRows.filter((row) => row.vendor === vendor.id)
  if (!rows.length) return
  const folder = path.join(root, `${safeName(vendor.name)}--${vendor.id}`)
  await mkdir(folder, { recursive: true })
  const marker = path.join(folder, '.whatsapp-intake')
  try { await stat(marker) } catch {
    try { await stat(path.join(folder, 'products.xlsx')); throw new Error('Refusing to replace an unmanaged workbook') }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    await writeFile(marker, 'Generated intake exports. The local inbox is the source of truth.', { flag: 'wx' })
  }
  const { products, review } = groupProducts(rows)
  const book = new ExcelJS.Workbook()
  book.creator = 'Gadgify WhatsApp intake'
  const productRows = []
  for (const product of products) {
    const base = safeName(product.fields.product)
    const relative = `media/${base}--${product.id}`
    const directory = path.join(folder, relative)
    await mkdir(directory, { recursive: true })
    const counters = {}, images = [], videos = []
    for (const row of product.messages.sort((a, b) => a.seq - b.seq)) {
      if (!row.message.mediaId) continue
      const kind = row.message.type
      counters[kind] = (counters[kind] ?? 0) + 1
      if (!row.media_path) continue
      const extension = path.extname(row.media_path).slice(1)
      const filename = `${base}-${counters[kind]}.${extension}`
      await copyFile(row.media_path, path.join(directory, filename))
      ;(row.message.type === 'video' ? videos : images).push(`${relative}/${filename}`)
    }
    const f = product.fields
    productRows.push([product.id, f.product, f.code ?? '', f.description ?? '', f.brand ?? '', f.category ?? '', f.price === undefined ? null : Number(f.price), 'INR', f.stock === undefined ? null : Number(f.stock), f.sizes ?? '', f.colors ?? '', images.join('\n'), videos.join('\n'), !f.price ? 'Needs review: price missing' : 'Draft: review before publishing', product.source.id])
  }
  const main = addSheet(book, 'Products', ['Product ID','Product name','Code','Description','Brand','Category','Price','Currency','Stock','Sizes','Colors','Image files','Video files','Review status','Source message ID'], productRows)
  main.getColumn(7).numFmt = '#,##0.00'
  addSheet(book, 'Needs review', ['Message ID','Reason','Original text','Media status','Downloaded media file'], rows.filter((row) => review.has(row.id) || row.media_error || (row.message.mediaId && !row.media_path)).map((row) => [row.id, review.get(row.id) ?? '', row.message.text, row.media_error || (row.message.mediaId && !row.media_path ? 'Pending download' : ''), row.media_path ? path.relative(folder, row.media_path) : '']))
  addSheet(book, 'Messages', ['Message ID','Received timestamp (Unix)','Type','Original text','Reply to'], rows.map((row) => [row.id, row.message.timestamp, row.message.type, row.message.text, row.message.replyTo]))
  const temp = path.join(folder, 'products.pending.xlsx')
  await book.xlsx.writeFile(temp)
  // A locked Excel file causes a retry later; do not discard the inbox or truncate the old workbook.
  await rename(temp, path.join(folder, 'products.xlsx'))
}
