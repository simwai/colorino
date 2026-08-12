import readline from 'node:readline'
import { getTerminalThemeSync } from '../../osc-theme-sync.js'
import { createColorino, log } from '../../node.js'

const logger = createColorino(
  {},
  {
    fileLogging: {
      path: './tmp/colorino-manual-cli.log',
      stripAnsi: true,
      timezone: 'local',
    },
  }
)

class ManualCli {
  @log(logger, { logLevel: 'debug' })
  echo(line: string): string {
    return `Echo: ${line}`
  }
}

const manualCli = new ManualCli()

function main() {
  const theme = getTerminalThemeSync()
  logger.info(`utils-cli$ (theme: ${theme})`)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const printPrompt = () => {
    logger.info('utils-cli$')
  }

  printPrompt()

  rl.on('line', line => {
    if (line === 'exit') {
      rl.close()
      return
    }

    logger.log(manualCli.echo(line))
    printPrompt()
  })

  rl.on('close', () => {
    process.exit(0)
  })
}

main()
