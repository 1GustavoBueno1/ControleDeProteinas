import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Bibliotecas em arquivos próprios: mudam pouco, então o celular reaproveita o cache
        // delas quando só o código do app é publicado de novo.
        codeSplitting: {
          groups: [
            { name: 'firestore', test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/, priority: 2 },
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 1 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
