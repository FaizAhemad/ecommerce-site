import type { PropsWithChildren } from 'react'
import { ThemeProvider } from '@mui/material'
import { gadgifyTheme } from './theme'

export function MUIProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={gadgifyTheme}>
      {children}
    </ThemeProvider>
  )
}
