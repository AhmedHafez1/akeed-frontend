type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  [key: string]: unknown
}

interface NormalizedError {
  errorName?: string
  errorMessage: string
  stack?: string
  error?: unknown
}

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

function getMinLogLevel(): LogLevel {
  const env = process.env.NODE_ENV

  if (env === 'production') {
    return 'warn'
  }

  if (env === 'test') {
    return 'warn'
  }

  return 'debug'
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_WEIGHT[level] <= LOG_LEVEL_WEIGHT[getMinLogLevel()]
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    }
  }

  if (typeof error === 'string') {
    return {
      errorMessage: error,
    }
  }

  return {
    errorName: 'UnknownError',
    errorMessage: 'Unknown error',
    error,
  }
}

function emit(level: LogLevel, message: string, data?: LogContext): void {
  if (!shouldLog(level)) {
    return
  }

  const payload = data && Object.keys(data).length > 0 ? data : undefined

  if (level === 'error') {
    if (payload) {
      console.error(message, payload)
    } else {
      console.error(message)
    }
    return
  }

  if (level === 'warn') {
    if (payload) {
      console.warn(message, payload)
    } else {
      console.warn(message)
    }
    return
  }

  if (level === 'info') {
    if (payload) {
      console.info(message, payload)
    } else {
      console.info(message)
    }
    return
  }

  if (payload) {
    console.debug(message, payload)
  } else {
    console.debug(message)
  }
}

export function createLogger(moduleName: string) {
  const tag = `[${moduleName}]`

  return {
    error(message: string, error?: unknown, context?: LogContext) {
      const normalized =
        error === undefined ? undefined : normalizeError(error)

      emit('error', `${tag} ${message}`, {
        ...context,
        ...normalized,
      })
    },

    warn(message: string, context?: LogContext) {
      emit('warn', `${tag} ${message}`, context)
    },

    info(message: string, context?: LogContext) {
      emit('info', `${tag} ${message}`, context)
    },

    debug(message: string, context?: LogContext) {
      emit('debug', `${tag} ${message}`, context)
    },
  }
}
