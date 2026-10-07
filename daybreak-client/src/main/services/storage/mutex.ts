/** Tiny per-key async mutex so concurrent IPC calls never interleave writes to the same file. */
const tails = new Map<string, Promise<unknown>>()

export function withMutex<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve()
  const run = previous.then(() => fn())
  // Always resolves (never rejects) so a failed task doesn't poison the queue for the next one.
  const settledTail = run.then(
    () => undefined,
    () => undefined
  )
  tails.set(key, settledTail)
  return run
}
