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

export async function getErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`

  try {
    const data = (await parseJsonResponse<Record<string, unknown>>(
      response
    )) as { message?: string | string[] }

    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message.join(', ')
    }

    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message
    }
  } catch {
    return fallback
  }

  return fallback
}
