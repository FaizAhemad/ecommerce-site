import { build } from 'vite'

// User-owned production validation: compile without loading local environment files.
await build({ envDir: false })
