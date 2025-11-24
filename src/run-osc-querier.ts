import { OscThemeQuerier } from './osc-theme-querier.js'

async function run() {
  // We attach to the inherited stdin/stdout from the parent
  const querier = new OscThemeQuerier(process.stdin, process.stdout)

  // 300ms timeout inside the querier is usually enough
  const result = await querier.query()

  if (result.isOk()) {
    // IMPORTANT: Just print the theme string ('dark' or 'light')
    // Do not print newlines or extra text if possible, though trim() in parent helps
    process.stdout.write(result.value)
    process.exit(0)
  } else {
    // Silently fail or exit with code 1
    process.exit(1)
  }
}

run()
