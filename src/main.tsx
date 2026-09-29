import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './i18n'
import App from './App.tsx'
import { queryClient } from './api/queryClient'
import { MUIProvider } from './components/mui/MUIProvider'

createRoot(document.getElementById('root')!).render(
  <MUIProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </MUIProvider>,
)
