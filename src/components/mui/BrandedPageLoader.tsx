import { alpha } from '@mui/material/styles'
import { Box } from './Box'
import { CircularProgress } from './CircularProgress'
import { Stack } from './Stack'
import { Typography } from './Typography'

/** Shared Gadgify route-level loading treatment; the site shell remains visible. */
export function BrandedPageLoader({ message = 'Getting this page ready' }: { message?: string }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      sx={{
        position: 'relative',
        isolation: 'isolate',
        display: 'grid',
        width: '100%',
        minHeight: { xs: 'clamp(22rem, 54svh, 30rem)', sm: 'clamp(25rem, 58svh, 34rem)' },
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        background: (theme) => `radial-gradient(ellipse at 12% 18%, ${alpha(theme.palette.primary.light, 0.72)} 0%, transparent 40%), radial-gradient(ellipse at 88% 82%, ${alpha(theme.palette.secondary.main, 0.18)} 0%, transparent 34%), ${theme.palette.background.default}`,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          zIndex: -1,
          top: { xs: -46, sm: -76 },
          right: { xs: -42, sm: '8%' },
          width: { xs: 132, sm: 192 },
          aspectRatio: '1',
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.13),
          borderRadius: '50%',
        }}
      />
      <Stack
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{
          width: 'min(100%, 28rem)',
          alignItems: 'center',
          textAlign: 'center',
          px: { xs: 2.5, sm: 4 },
          py: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: { xs: 3, sm: 4 },
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.88),
          boxShadow: '0 18px 48px rgba(23, 43, 58, 0.07)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ position: 'relative', display: 'grid', width: 76, height: 76, placeItems: 'center' }}>
          <CircularProgress
            size={76}
            thickness={1.5}
            aria-hidden="true"
            sx={{ color: 'secondary.dark', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}
          />
          <Box
            sx={{
              position: 'absolute',
              display: 'grid',
              width: 54,
              height: 54,
              placeItems: 'center',
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: (theme) => `0 6px 18px ${alpha(theme.palette.primary.main, 0.24)}`,
            }}
          >
            <Typography component="span" variant="h5" sx={{ color: 'inherit', fontWeight: 700 }}>G</Typography>
          </Box>
        </Box>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.16em' }}>GADGIFY</Typography>
          <Typography component="p" variant="h6" sx={{ fontWeight: 600 }}>{message}…</Typography>
          <Typography variant="body2" color="text.secondary">Useful finds are just a moment away.</Typography>
        </Stack>
        <Box aria-hidden="true" sx={{ display: 'flex', gap: 0.75, pt: 0.5 }}>
          {[0, 1, 2].map((item) => <Box key={item} sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item === 1 ? 'secondary.main' : 'primary.light', opacity: item === 1 ? 1 : 0.7 }} />)}
        </Box>
      </Stack>
    </Box>
  )
}
