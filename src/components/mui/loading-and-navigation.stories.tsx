import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, LinearProgress, Pagination, Skeleton, Stack, Tab, Tabs, Typography } from './index'

const meta = { title: 'Gadgify/Loading and navigation', component: Pagination } satisfies Meta<typeof Pagination>
export default meta
type Story = StoryObj<typeof meta>

export const LoadingStates: Story = { render: () => <Stack spacing={2} sx={{ maxWidth: 560 }}><LinearProgress aria-label="Loading results" /><Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}><CircularProgress size={28} aria-label="Saving" /><Typography>Saving your changes…</Typography></Stack><Skeleton variant="rounded" height={64} /><Skeleton variant="text" width="60%" /></Stack> }

export const PaginationControls: Story = { render: () => <Pagination count={8} page={2} color="primary" aria-label="Product pages" /> }

export const FAQ: Story = { render: () => <Accordion sx={{ maxWidth: 600 }}><AccordionSummary expandIcon={<span aria-hidden="true">⌄</span>}><Typography>How can I track my order?</Typography></AccordionSummary><AccordionDetails>Open Orders and select Track an order to see recorded delivery updates.</AccordionDetails></Accordion> }

export const TabsExample: Story = { render: () => { const [value, setValue] = useState(0); return <Tabs value={value} onChange={(_, next) => setValue(next)} aria-label="Admin sections"><Tab label="Products" /><Tab label="Orders" /><Tab label="Customers" /></Tabs> } }
