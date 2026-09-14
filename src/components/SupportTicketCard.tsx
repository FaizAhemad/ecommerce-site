import { useState } from 'react'
import type { SupportTicket } from '../api/support'
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
    <article className="order-card">
      <h2>{ticket.subject}</h2>
      <p>Reference: {ticket.id}</p>
      <p>Status: {ticket.status.replaceAll('_', ' ')}</p>
      <p className="support-message">{ticket.body}</p>
      {ticket.resolution && <p>Resolution / reason: {ticket.resolution}</p>}
      {['OPEN', 'IN_PROGRESS'].includes(ticket.status) &&
        (admin || ticket.status === 'OPEN') &&
        (!editing ? (
          <button className="secondary-button" disabled={pending} onClick={() => setEditing(true)}>
            {admin ? 'Update request' : 'Cancel request'}
          </button>
        ) : (
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault()
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
              <label>
                Status
                <select
                  value={status}
                  disabled={pending}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
            )}
            <label>
              {admin ? 'Resolution or reason' : 'Cancellation reason'}
              <textarea
                required={status !== 'IN_PROGRESS'}
                maxLength={2000}
                rows={3}
                value={reason}
                disabled={pending}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="profile-actions">
              <button className="primary-button" disabled={pending}>
                Save status
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={pending}
                onClick={() => setEditing(false)}
              >
                Keep request unchanged
              </button>
            </div>
          </form>
        ))}
    </article>
  )
}
