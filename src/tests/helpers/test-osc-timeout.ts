import { getTerminalThemeSync } from '../../osc-theme-sync.js'

function main() {
  const theme = getTerminalThemeSync(true)

  console.log('Completed without crash')
  console.log('Theme result:', theme)
}

main()
