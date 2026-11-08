import { mergeConfig } from 'vite'
import base from './vite.config'
import { hydrationInstrumentation } from './scripts/hydration-instrumentation'

export default mergeConfig(base, {
  plugins: [hydrationInstrumentation(process.cwd())],
  build: { outDir: '.history-hydration-build', emptyOutDir: true },
})
