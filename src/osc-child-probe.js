const stdin = process.stdin
const stdout = process.stdout
const stderr = process.stderr

if (!stdin.isTTY || !stdin.setRawMode) {
  stdout.write('unknown\n')
  process.exit(0)
}

let buffer = ''
let done = false

const finish = theme => {
  if (done) return
  done = true

  stdin.removeListener('data', onData)
  try {
    stdin.setRawMode(false)
  } catch {}
  stdin.pause()

  stdout.write(theme + '\n')
  process.exit(0)
}

const onData = chunk => {
  buffer += chunk.toString('utf8')

  if (
    !buffer.includes(']11;rgb:') ||
    (!buffer.includes('\x07') && !buffer.includes('\x1b\\'))
  )
    return

  const match = buffer.match(
    /rgb:([0-9a-f]{2,4})\/([0-9a-f]{2,4})\/([0-9a-f]{2,4})/i
  )
  if (!match) {
    finish('unknown')
    return
  }

  const normalize = hex => {
    const value = parseInt(hex, 16)
    const max = (1 << (4 * hex.length)) - 1
    return Math.round((value / max) * 255)
  }

  const red = normalize(match[1])
  const green = normalize(match[2])
  const blue = normalize(match[3])
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255

  finish(luminance < 0.5 ? 'dark' : 'light')
}

stdin.on('data', onData)
stdin.setRawMode(true)
stdin.resume()

stderr.write('\x1b]11;?\x07')

setTimeout(() => {
  finish('unknown')
}, 300)