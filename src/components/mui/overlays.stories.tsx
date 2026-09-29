import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Backdrop, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, Stack, TextField, Typography } from './index'

const meta = { title: 'Gadgify/Dialogs and drawers', component: Dialog } satisfies Meta<typeof Dialog>
export default meta
type Story = StoryObj<typeof meta>

export const FormDialog: Story = {
  args: { open: false },
  render: () => {
    const [open, setOpen] = useState(false)
    return <><Button variant="contained" onClick={() => setOpen(true)}>Edit address</Button><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Delivery address</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Full name" /><TextField label="PIN code" /></Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={() => setOpen(false)}>Save address</Button></DialogActions></Dialog></>
  },
}

export const SidePanel: Story = {
  args: { open: false },
  render: () => {
    const [open, setOpen] = useState(false)
    return <><Button variant="outlined" onClick={() => setOpen(true)}>Open panel</Button><Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 'min(420px, calc(100vw - 24px))', p: 3 } } }}><Stack spacing={2}><Typography variant="h5">Personal details</Typography><TextField label="Name" /><Button variant="contained" onClick={() => setOpen(false)}>Save details</Button></Stack></Drawer></>
  },
}

export const ModalBackdrop: Story = {
  args: { open: false },
  render: () => {
    const [open, setOpen] = useState(false)
    return <><Button variant="outlined" onClick={() => setOpen(true)}>Show backdrop</Button><Backdrop open={open} onClick={() => setOpen(false)} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fffefa' }}><Typography>Click to close</Typography></Backdrop></>
  },
}
