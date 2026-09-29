import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertTitle, Avatar, Badge, Card, CardContent, CardHeader, Chip, Divider, Paper, Stack, Typography } from './index'

const meta = { title: 'Gadgify/Surfaces and feedback', component: Card } satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>

export const RecordCard: Story = {
  render: () => <Card variant="outlined" sx={{ maxWidth: 560 }}><CardHeader avatar={<Avatar>G</Avatar>} title="Order GAD-12345" subheader="Placed today" action={<Chip label="Processing" color="info" size="small" />} /><Divider /><CardContent><Typography variant="h6">Your items</Typography><Typography color="text.secondary">1 × Portable oral dental flosser</Typography><Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2 }}><Typography>Order total</Typography><Typography sx={{ fontWeight: 700 }}>₹100.00</Typography></Stack></CardContent></Card>,
}

export const Messages: Story = {
  render: () => <Stack spacing={2} sx={{ maxWidth: 600 }}><Alert severity="success"><AlertTitle>Saved</AlertTitle>Your address is ready to use at checkout.</Alert><Alert severity="info">Delivery is free for now.</Alert><Alert severity="warning">Payment confirmation is still pending.</Alert><Alert severity="error">We couldn’t save these changes. Your entries are still here.</Alert></Stack>,
}

export const BadgesAndChips: Story = {
  render: () => <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}><Badge badgeContent={3} color="secondary"><Avatar>G</Avatar></Badge><Chip label="In stock" color="success" size="small" /><Chip label="Archived" variant="outlined" size="small" /></Stack>,
}

export const PaperSurface: Story = { render: () => <Paper variant="outlined" sx={{ maxWidth: 560, p: 3 }}><Typography variant="h5" gutterBottom>Section title</Typography><Typography color="text.secondary">Use consistent surfaces and spacing for related content.</Typography></Paper> }
