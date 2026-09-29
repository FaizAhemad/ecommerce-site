import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alert, Backdrop, Button, Checkbox, FormControlLabel, MUIProvider, Radio, RadioGroup, Skeleton, TextField } from './index'
import { DataGrid, type DataGridQuery } from '../DataGrid'
import { AddToCartButton } from '../AddToCartButton'
import { createSessionRefreshCoordinator } from '../../api/sessionRefresh'

function renderMUI(ui: ReactNode) {
  return render(<MUIProvider>{ui}</MUIProvider>)
}

afterEach(cleanup)

describe('Gadgify MUI components', () => {
  it('keeps loaded grid rows visible during refresh without rendering skeleton rows', () => {
    renderMUI(<DataGrid rows={[{ id: 'p1', name: 'Matchstick gas lighter' }]} totalRows={100} columns={[{ id: 'name', header: 'Product', cell: (row) => row.name }]} getRowKey={(row) => row.id} label="Products" emptyMessage="No products" onQueryChange={vi.fn()} isLoading />)

    expect(screen.getByText('Matchstick gas lighter')).toBeTruthy()
    expect(screen.getByRole('progressbar')).toBeTruthy()
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0)
    expect(screen.getByText('Rows per page:')).toBeTruthy()
    expect(screen.queryByText('Rows per page', { exact: true })).toBeNull()
    expect(screen.queryByRole('button', { name: /disable column filters/i })).toBeNull()
    expect(screen.queryByText('100 matches')).toBeNull()
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toBeTruthy()
  })

  it('allows direct pagination jumps across more than one thousand server pages', async () => {
    const user = userEvent.setup()
    const queries: DataGridQuery[] = []
    renderMUI(<DataGrid rows={[{ id: 'p1', name: 'Product' }]} totalRows={10_000} columns={[{ id: 'name', header: 'Product', cell: (row) => row.name }]} getRowKey={(row) => row.id} label="Products" emptyMessage="No products" onQueryChange={(query) => queries.push(query)} />)

    const pageField = screen.getByRole('spinbutton', { name: 'Go to page' })
    await user.clear(pageField)
    await user.type(pageField, '1000')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(queries.at(-1)?.page).toBe(1000))
    expect(screen.getByText('of 1000')).toBeTruthy()
  })

  it('supports keyboard and pointer activation for primary actions', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderMUI(<Button variant="contained" onClick={onClick}>Add to cart</Button>)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add to cart' }))
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('shows a readable in-cart quantity without stretching the product detail control', () => {
    renderMUI(<AddToCartButton productId="product-1" onAdd={vi.fn()} onDecrease={vi.fn()} label="Add to cart" quantity={1} sx={{ width: 'fit-content', minWidth: 196, maxWidth: '100%' }} quantityControlSx={{ width: 220, maxWidth: '100%' }} />)

    expect(screen.getByText('1 in cart')).toBeTruthy()
    expect(screen.getByRole('group', { name: '1 item in cart' })).toBeTruthy()
  })

  it('joins an in-flight activity renewal when Continue is clicked', async () => {
    let complete!: () => void
    const operation = vi.fn(() => new Promise<void>((resolve) => { complete = resolve }))
    const refresh = createSessionRefreshCoordinator(operation, () => true)
    const activity = refresh(true)
    const continueClick = refresh(true)

    expect(operation).toHaveBeenCalledTimes(1)
    complete()
    await Promise.all([activity, continueClick])
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('renews after an in-flight read-only expiry probe completes', async () => {
    let completeProbe!: () => void
    const operation = vi.fn((activity: boolean) => activity
      ? Promise.resolve()
      : new Promise<void>((resolve) => { completeProbe = resolve }))
    const refresh = createSessionRefreshCoordinator(operation, () => true)
    const probe = refresh(false)
    const continueClick = refresh(true)

    expect(operation).toHaveBeenCalledTimes(1)
    completeProbe()
    await Promise.all([probe, continueClick])
    expect(operation.mock.calls.map(([activity]) => activity)).toEqual([false, true])
  })

  it('keeps pending actions disabled and validation messages associated with fields', () => {
    renderMUI(<><Button disabled>Saving address…</Button><TextField label="Email address" error helperText="Enter a valid email address." /><Alert severity="error">Your changes were not saved.</Alert></>)

    expect(screen.getByRole('button', { name: 'Saving address…' }).hasAttribute('disabled')).toBe(true)
    const field = screen.getByRole('textbox', { name: 'Email address' })
    const descriptionId = field.getAttribute('aria-describedby')
    expect(descriptionId ? document.getElementById(descriptionId)?.textContent : '').toBe('Enter a valid email address.')
    expect(screen.getByRole('alert').textContent).toContain('Your changes were not saved.')
  })

  it('exposes accessible, interactive brand checkbox and radio controls', async () => {
    const user = userEvent.setup()
    renderMUI(
      <>
        <FormControlLabel control={<Checkbox />} label="Get product updates" />
        <RadioGroup aria-label="Delivery speed" defaultValue="standard">
          <FormControlLabel value="standard" control={<Radio />} label="Standard" />
          <FormControlLabel value="express" control={<Radio />} label="Express" />
        </RadioGroup>
      </>,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Get product updates' }) as HTMLInputElement
    const standard = screen.getByRole('radio', { name: 'Standard' }) as HTMLInputElement
    const express = screen.getByRole('radio', { name: 'Express' }) as HTMLInputElement
    expect(standard.checked).toBe(true)
    await user.click(checkbox)
    await user.click(express)
    expect(checkbox.checked).toBe(true)
    expect(standard.checked).toBe(false)
    expect(express.checked).toBe(true)
  })

  it('renders branded loading placeholders and an open modal backdrop', async () => {
    renderMUI(<><Skeleton data-testid="product-loading" variant="rounded" width={120} height={24} /><Backdrop open><span role="status">Please wait</span></Backdrop></>)

    expect(screen.getByTestId('product-loading').getAttribute('aria-hidden')).toBe('true')
    expect((await screen.findByRole('status')).textContent).toContain('Please wait')
  })
})
