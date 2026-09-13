import { QueryClient } from '@tanstack/react-query'
import { ApiRateLimitError } from './http.ts'

// Private resources use privateKey(account, session generation, resource).
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
