import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Autocomplete, Checkbox, FormControlLabel, MenuItem, Radio, RadioGroup, Select, Stack, Switch, TextField, Typography } from './index'

const meta = { title: 'Gadgify/Forms', component: TextField } satisfies Meta<typeof TextField>
export default meta
type Story = StoryObj<typeof meta>

export const Inputs: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 480 }}>
      <TextField label="Search products" placeholder="Try a product name" />
      <TextField label="Email address" type="email" error helperText="Enter a valid email address." />
      <TextField label="Delivery PIN code" slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }} />
      <Select defaultValue="all" aria-label="Category"><MenuItem value="all">All categories</MenuItem><MenuItem value="home">Home & Kitchen</MenuItem></Select>
      <Autocomplete options={['Home & Kitchen', 'Accessories', 'Electronics']} renderInput={(params) => <TextField {...params} label="Category" />} />
      <FormControlLabel control={<Checkbox defaultChecked />} label="Set as default address" />
      <FormControlLabel control={<Switch defaultChecked />} label="Published" />
      <RadioGroup defaultValue="standard"><FormControlLabel value="standard" control={<Radio />} label="Standard delivery" /><FormControlLabel value="express" control={<Radio />} label="Express delivery" /></RadioGroup>
    </Stack>
  ),
}

export const PendingForm: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return <Stack spacing={2} sx={{ maxWidth: 480 }}><Typography variant="h6">Address details</Typography><TextField label="Full name" value={value} onChange={(event) => setValue(event.target.value)} /><TextField label="Street address" multiline minRows={3} /><FormControlLabel control={<Checkbox />} label="Use this as my default address" /></Stack>
  },
}
