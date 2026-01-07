import { getTerminalThemeSync } from '../../osc-theme-sync.js'

function main() {
  // This may block a bit, but should always return and never throw
  const theme = getTerminalThemeSync()

  console.log('Completed without crash')
  console.log('Theme result:', theme)
}

main()
