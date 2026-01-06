import readline from 'node:readline'
import { getTerminalThemeSync } from '../../osc-theme-sync.js'

function main() {
  const theme = getTerminalThemeSync()
  console.log('After probe, theme:', theme)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question('', answer => {
    console.log('Received:', answer)
    rl.close()
  })

  rl.on('close', () => {
    process.exit(0)
  })
}

main()