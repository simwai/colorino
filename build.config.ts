import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/browser',
    'src/node',
  ],
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  externals: ['neverthrow'],
})
