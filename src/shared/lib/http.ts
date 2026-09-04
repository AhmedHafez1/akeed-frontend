export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    throw new Error('Empty API response')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Invalid API response')
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function createApiError(response: Response): Promise<ApiError> {
  const fallback = `Request failed with status ${response.status}`

  try {
    const data = await parseJsonResponse<Record<string, unknown>>(response)
    const message = Array.isArray(data.message)
      ? data.message
          .filter((item): item is string => typeof item === 'string')
          .join(', ')
      : typeof data.message === 'string' && data.message.trim().length > 0
        ? data.message
        : fallback
    const code = typeof data.code === 'string' ? data.code : undefined
    return new ApiError(message, response.status, code)
  } catch {
    return new ApiError(fallback, response.status)
  }
}

export async function getErrorMessage(response: Response): Promise<string> {
  return (await createApiError(response)).message
}
