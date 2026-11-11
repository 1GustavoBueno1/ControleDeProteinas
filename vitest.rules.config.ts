import { defineConfig } from 'vitest/config'

// Testes das Firestore Security Rules: precisam do emulador, por isso ficam fora do "npm test".
// Rodar com "npm run test:rules", que sobe o emulador e executa estes testes dentro dele.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
