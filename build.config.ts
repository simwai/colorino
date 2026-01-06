import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/browser', 'src/node'],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
  hooks: {
    'rollup:options'(_ctx, options) {
      // Custom external function
      options.external = id => {
        // 1. Externalize Node built-ins (must happen!)
        if (id.startsWith('node:')) return true

        // 2. Bundle 'neverthrow' (return false)
        if (id === 'neverthrow') return false

        // 3. Default behavior for other things?
        // If you want to bundle everything else in dependencies, return false.
        return false
      }
    },
  },
  failOnWarn: false,
})