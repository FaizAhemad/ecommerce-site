import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrandedPageLoader } from './BrandedPageLoader'

const meta = {
  title: 'Gadgify/Loading/Branded page backdrop',
  component: BrandedPageLoader,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BrandedPageLoader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OpeningWorkspace: Story = {
  args: { message: 'Opening the admin workspace' },
}
