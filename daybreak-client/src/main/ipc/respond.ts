import type { AppResult } from '@shared/ipc-api'
import type { z } from 'zod'

/**
 * Wraps a handler body so every thrown error becomes a structured AppResult instead of an
 * IPC rejection with a stack trace the renderer can't show to the user. Every handler in this
 * app goes through here (or `validated`) - no IPC handler is allowed to throw past this.
 */
export async function respond<T>(fn: () => Promise<T>): Promise<AppResult<T>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: toErrorPayload(error) }
  }
}

export function toErrorPayload(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    return { code: error.name, message: error.message }
  }
  return { code: 'UnknownError', message: String(error) }
}

/** Validates renderer-supplied input with a zod schema before it reaches any service code. */
export function validated<Schema extends z.ZodType, T>(
  schema: Schema,
  input: unknown,
  fn: (value: z.infer<Schema>) => Promise<T>
): Promise<AppResult<T>> {
  return respond(async () => {
    const result = schema.safeParse(input)
    if (!result.success) {
      throw new Error(`Ungültige Eingabe: ${result.error.message}`)
    }
    return fn(result.data)
  })
}
