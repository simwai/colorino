import { getTerminalThemeSync } from '../../osc-theme-sync.js'

function main() {
  const theme = getTerminalThemeSync()
  console.log('Done, theme:', theme)
}

main()
