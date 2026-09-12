import { QueryClient } from '@tanstack/react-query'
import { ApiRateLimitError } from './http'

// The shared cache is currently limited to public catalog/configuration data.
// Private cart, order, payment, wishlist, and admin queries must remain
// user-scoped before they are added here.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => !(error instanceof ApiRateLimitError) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
})
