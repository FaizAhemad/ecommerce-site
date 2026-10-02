import { useState } from 'react'
import type { SupportTicket } from '../api/support'
import { SupportAttachments } from './SupportAttachments'
import { SupportConversation } from './SupportConversation'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Chip } from './mui/Chip'
import { FormControl } from './mui/FormControl'
import { InputLabel } from './mui/InputLabel'
import { MenuItem } from './mui/MenuItem'
import { Paper } from './mui/Paper'
import { Select } from './mui/Select'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
}

export function SupportTicketCard({
  ticket,
  admin,
  pending,
  update,
}: {
  ticket: SupportTicket
  admin: boolean
  pending: boolean
  update: (body: unknown) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(admin ? 'IN_PROGRESS' : 'CANCELLED')
  const [reason, setReason] = useState('')
  return (
    <Paper component="article" variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
        >
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="h6" sx={{ overflowWrap: 'anywhere' }}>
              {ticket.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              Reference: {ticket.id}
            </Typography>
          </Stack>
          <Chip
            size="small"
            color={ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'CANCELLED' ? 'default' : 'primary'}
            label={statusLabels[ticket.status] ?? ticket.status.replaceAll('_', ' ')}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}
          />
        </Stack>

        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {ticket.body}
          </Typography>
        </Paper>

        <SupportAttachments
          ticketId={ticket.id}
          canUpload={!admin && ['OPEN', 'IN_PROGRESS'].includes(ticket.status)}
        />
        <SupportConversation ticketId={ticket.id} open={['OPEN', 'IN_PROGRESS'].includes(ticket.status)} />
        {ticket.resolution && (
          <Alert severity={ticket.status === 'RESOLVED' ? 'success' : 'info'}>
            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
              {admin ? 'Resolution or reason: ' : 'Response: '}
            </Typography>
            {ticket.resolution}
          </Alert>
        )}

        {['OPEN', 'IN_PROGRESS'].includes(ticket.status) &&
          (admin || ticket.status === 'OPEN') &&
          (!editing ? (
            <Button
              variant="outlined"
              disabled={pending}
              onClick={() => setEditing(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {admin ? 'Update request' : 'Cancel request'}
            </Button>
          ) : (
            <Stack
              component="form"
              spacing={2}
              onSubmit={async (event) => {
                event.preventDefault()
                if (
                  await update({
                    id: ticket.id,
                    status,
                    expectedStatus: ticket.status,
                    resolution: reason,
                  })
                ) {
                  setEditing(false)
                  setReason('')
                }
              }}
            >
              {admin && (
                <FormControl fullWidth size="small" disabled={pending}>
                  <InputLabel id={`support-status-${ticket.id}`}>Status</InputLabel>
                  <Select
                    labelId={`support-status-${ticket.id}`}
                    label="Status"
                    value={status}
                    onChange={(event) => setStatus(String(event.target.value))}
                  >
                    <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              )}
              <TextField
                label={admin ? 'Resolution or reason' : 'Cancellation reason'}
                required={status !== 'IN_PROGRESS'}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
                multiline
                minRows={3}
                value={reason}
                disabled={pending}
                onChange={(event) => setReason(event.target.value)}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button type="submit" variant="contained" disabled={pending}>
                  {pending ? 'Saving…' : 'Save status'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  disabled={pending}
                  onClick={() => setEditing(false)}
                >
                  Keep request unchanged
                </Button>
              </Stack>
            </Stack>
          ))}
      </Stack>
    </Paper>
  )
}
