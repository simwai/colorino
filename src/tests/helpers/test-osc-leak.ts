import { getTerminalThemeSync } from '../../osc-theme-sync.js'

function main() {
  const theme = getTerminalThemeSync(true)
  console.log('Done, theme:', theme)
}

main()
