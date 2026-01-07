import readline from 'node:readline'
import { getTerminalThemeSync } from '../../osc-theme-sync.js'

function main() {
  const theme = getTerminalThemeSync()
  console.log(`utils-cli$ (theme: ${theme})`)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const printPrompt = () => {
    console.log('utils-cli$')
  }

  printPrompt()

  rl.on('line', line => {
    if (line === 'exit') {
      rl.close()
      return
    }

    console.log(`Echo: ${line}`)
    printPrompt()
  })

  rl.on('close', () => {
    process.exit(0)
  })
}

main()
