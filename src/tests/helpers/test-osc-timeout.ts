import { getTerminalThemeSync } from '../../osc-theme-sync.js'

function main() {
  const theme = getTerminalThemeSync()

  console.log('Completed without crash')
  console.log('Theme result:', theme)
}

main()
