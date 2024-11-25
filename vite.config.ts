import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts', // 入口文件
      formats: ['es', 'cjs'], // 输出两种格式：ESM 和 CommonJS
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    rollupOptions: {
      external: [], // 指定外部依赖（例如 Node.js 内置模块或其他 npm 包）
    },
  },
})
