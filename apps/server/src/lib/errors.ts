import type { z } from 'zod'

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code = 'ERROR',
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue?.path.join('.')
    const message = issue ? (field ? `${field}: ${issue.message}` : issue.message) : 'Invalid input'
    throw new HttpError(400, message, 'VALIDATION_ERROR')
  }
  return result.data
}
