import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/colorino', 'src/node-color-support-detector'],
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  externals: ['color-convert'],
})
