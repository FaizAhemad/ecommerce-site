import { useCallback, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DataGrid, type DataGridColumn, type DataGridQuery } from '../DataGrid'
import { Box, Chip, TextField, Typography } from './index'

type Product = { id: string; name: string; price: number; stock: number; visibility: string }
const products: Product[] = [
  { id: '1', name: 'Portable oral dental flosser', price: 100, stock: 24, visibility: 'Published' },
  { id: '2', name: 'Floral table mat', price: 149, stock: 8, visibility: 'Published' },
  { id: '3', name: 'Steel water bottle', price: 525, stock: 0, visibility: 'Draft' },
]
const columns: DataGridColumn<Product>[] = [
  { id: 'name', header: 'Product', cell: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>, getFilterValue: (row) => row.name, minWidthClass: 'min-w-64' },
  { id: 'price', header: 'Price', cell: (row) => <TextField size="small" type="number" defaultValue={row.price} slotProps={{ htmlInput: { 'aria-label': `Price for ${row.name}`, min: 0 } }} />, getFilterValue: (row) => row.price, filterType: 'number', filterStep: 0.01 },
  { id: 'stock', header: 'Stock', cell: (row) => row.stock, getFilterValue: (row) => row.stock, filterType: 'number' },
  { id: 'visibility', header: 'Visibility', cell: (row) => <Chip size="small" label={row.visibility} color={row.visibility === 'Published' ? 'success' : 'default'} />, getFilterValue: (row) => row.visibility, filterOptions: ['Published', 'Draft'].map((value) => ({ value, label: value })) },
]

function GridExample({ loading = false, empty = false, large = false, phone = false }) {
  const [query, setQuery] = useState<DataGridQuery | null>(null)
  const onQueryChange = useCallback((next: DataGridQuery) => setQuery(next), [])
  return <Box sx={{ width: phone ? 360 : '100%', maxWidth: '100%' }}>
    <DataGrid rows={empty ? [] : products} totalRows={empty ? 0 : large ? 12000 : products.length} columns={columns} getRowKey={(row) => row.id} label="Products" emptyMessage="No products yet" isLoading={loading} onQueryChange={onQueryChange} />
    <Typography variant="caption" component="p" sx={{ mt: 2 }}>Fixture only: controls emit server queries below; this story does not fetch or save records.</Typography>
    <Box component="pre" sx={{ fontSize: 12, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(query, null, 2)}</Box>
  </Box>
}

const meta = { title: 'Gadgify/Shared server grid', component: GridExample } satisfies Meta<typeof GridExample>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Refreshing: Story = { args: { loading: true } }
export const FirstLoad: Story = { args: { loading: true, empty: true } }
export const Empty: Story = { args: { empty: true } }
export const ThousandPages: Story = { args: { large: true } }
export const Phone: Story = { args: { phone: true } }
