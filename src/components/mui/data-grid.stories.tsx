import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, DataGrid, type GridColDef } from './index'

type ProductRow = { id: number; product: string; category: string; price: number; stock: number }
const rows: ProductRow[] = [
  { id: 1, product: 'Portable oral dental flosser', category: 'Electronics', price: 100, stock: 24 },
  { id: 2, product: 'Cute 3D floral mat', category: 'Home & Kitchen', price: 149, stock: 8 },
  { id: 3, product: 'Matchstick gas lighter', category: 'Home & Kitchen', price: 245, stock: 0 },
]
const columns: GridColDef[] = [
  { field: 'product', headerName: 'Product', flex: 1, minWidth: 220 },
  { field: 'category', headerName: 'Category', minWidth: 160 },
  { field: 'price', headerName: 'Price', type: 'number', valueFormatter: (value) => `₹${value}`, minWidth: 120 },
  { field: 'stock', headerName: 'Stock', type: 'number', minWidth: 110 },
]

const meta = { title: 'Gadgify/Data grid', component: DataGrid } satisfies Meta<typeof DataGrid>
export default meta
type Story = StoryObj<typeof meta>

export const CommunityGrid: Story = {
  args: { rows, columns },
  render: () => <Box sx={{ height: 380, width: '100%' }}><DataGrid rows={rows} columns={columns} pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} disableRowSelectionOnClick /></Box>,
}

export const Refreshing: Story = {
  args: { rows, columns },
  render: () => <Box sx={{ height: 380, width: '100%' }}><DataGrid rows={rows} columns={columns} loading pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick /></Box>,
}
