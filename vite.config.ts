import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Mantém o limite de aviso mais alto caso precise
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        // Nova sintaxe do Rolldown para Code Splitting
        codeSplitting: {
          minSize: 20000, // Cria chunks apenas para pacotes maiores que 20kB
          groups: [
            {
              name: 'vendor',
              test: /node_modules/, // Isola as bibliotecas externas em um arquivo próprio
            },
          ],
        },
      },
    },
  },
})