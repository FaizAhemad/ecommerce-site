import type { Preview } from '@storybook/react-vite'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { gadgifyTheme } from '../src/components/mui/theme'

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={gadgifyTheme}>
        <CssBaseline />
        <div style={{ padding: 24, minHeight: '100vh', background: gadgifyTheme.palette.background.default }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: { expanded: true },
    layout: 'fullscreen',
    viewport: { viewports: { phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } } },
  },
}

export default preview
