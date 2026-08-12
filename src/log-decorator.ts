import type {
  ColorinoNodeInterface,
  LogDecoratorOptions,
} from './interfaces.js'
import type { ConsoleMethod } from './types.js'

type Method<This, Args extends unknown[], Return> = (
  this: This,
  ...args: Args
) => Return

function write(
  logger: ColorinoNodeInterface,
  level: ConsoleMethod,
  message: string,
  value?: unknown
): void {
  const logMethod = logger[level]
  if (value === undefined) {
    logMethod.call(logger, message)
    return
  }

  logMethod.call(logger, message, value)
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    ((typeof value === 'object' && value !== null) ||
      typeof value === 'function') &&
    'then' in value
  )
}

export function log(
  logger: ColorinoNodeInterface,
  options: LogDecoratorOptions = {}
) {
  const level = options.logLevel ?? 'debug'
  const logArguments = options.logArguments ?? true
  const logReturnValue = options.logReturnValue ?? true

  return function <This, Args extends unknown[], Return>(
    target: Method<This, Args, Return>,
    context: ClassMethodDecoratorContext<This, Method<This, Args, Return>>
  ): Method<This, Args, Return> {
    const methodName = String(context.name)

    return function (this: This, ...args: Args): Return {
      write(
        logger,
        level,
        `${methodName}() called`,
        logArguments ? args : undefined
      )

      let result: Return
      try {
        result = target.call(this, ...args)
      } catch (error) {
        write(logger, level, `${methodName}() threw`, error)
        throw error
      }

      if (!isPromiseLike(result)) {
        if (logReturnValue)
          write(logger, level, `${methodName}() returned`, result)
        return result
      }

      return result.then(
        value => {
          if (logReturnValue)
            write(logger, level, `${methodName}() returned`, value)
          return value
        },
        error => {
          write(logger, level, `${methodName}() threw`, error)
          throw error
        }
      ) as Return
    }
  }
}
