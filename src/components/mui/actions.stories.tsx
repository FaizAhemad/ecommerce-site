import type { Meta, StoryObj } from '@storybook/react-vite'
import { AddShoppingCart, DeleteOutlined, Search } from '@mui/icons-material'
import { Button, ButtonGroup, IconButton, Stack, Tooltip } from './index'

const meta = { title: 'Gadgify/Actions', component: Button } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Buttons: Story = {
  render: () => (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Button variant="contained">Continue</Button>
      <Button variant="outlined">View details</Button>
      <Button variant="text">Cancel</Button>
      <Button variant="contained" color="secondary" startIcon={<AddShoppingCart />}>Add to cart</Button>
      <Button variant="contained" color="error" startIcon={<DeleteOutlined />}>Remove</Button>
    </Stack>
  ),
}

export const IconActions: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Search"><IconButton aria-label="Search"><Search /></IconButton></Tooltip>
      <Tooltip title="Remove item"><IconButton aria-label="Remove item" color="error"><DeleteOutlined /></IconButton></Tooltip>
    </Stack>
  ),
}

export const QuantityControls: Story = {
  render: () => (
    <ButtonGroup aria-label="Quantity controls" variant="outlined">
      <Button aria-label="Decrease quantity">−</Button><Button disabled>1</Button><Button aria-label="Increase quantity">+</Button>
    </ButtonGroup>
  ),
}
