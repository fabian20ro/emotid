import { expect, it } from 'vitest'
import { assertCatalogDeferred } from '../../scripts/catalog-startup-guard'

const catalog = '/project/src/models/catalog/index.ts'
it('allows a catalog that is only in a lazy chunk', () => {
  expect(() => assertCatalogDeferred([
    { fileName: 'app.js', isEntry: true, imports: [], modules: {} },
    { fileName: 'lazy.js', isEntry: false, imports: [], modules: { [catalog]: {} } },
  ])).not.toThrow()
})
it.each([catalog, 'C:\\project\\src\\models\\catalog\\index.ts'])('rejects a direct eager catalog owner: %s', (id) => {
  expect(() => assertCatalogDeferred([
    { fileName: 'app.js', isEntry: true, imports: [], modules: { [id]: {} } },
  ])).toThrow('Full catalog on startup path')
})
it('rejects an indirect eager catalog even when a presentation wrapper remains lazy', () => {
  expect(() => assertCatalogDeferred([
    { fileName: 'app.js', isEntry: true, imports: ['shared.js'], modules: {} },
    { fileName: 'shared.js', isEntry: false, imports: ['app.js'], modules: { [catalog]: {} } },
    { fileName: 'presentation.js', isEntry: false, imports: ['shared.js'], modules: {} },
  ])).toThrow('Full catalog on startup path')
})
