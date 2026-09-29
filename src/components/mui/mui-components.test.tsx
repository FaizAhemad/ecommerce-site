import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alert, Backdrop, Button, Checkbox, FormControlLabel, MUIProvider, Radio, RadioGroup, Skeleton, TextField } from './index'

function renderMUI(ui: ReactNode) {
  return render(<MUIProvider>{ui}</MUIProvider>)
}

describe('Gadgify MUI components', () => {
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
