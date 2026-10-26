import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  test: { environment: 'node', testTimeout: 30_000 }, // cada teste sobe um PGlite (lento em máquina ocupada)
})
