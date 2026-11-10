import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Os primeiros testes chegam na Etapa 2; até lá "npm test" não deve falhar por falta deles.
    passWithNoTests: true,
  },
})
