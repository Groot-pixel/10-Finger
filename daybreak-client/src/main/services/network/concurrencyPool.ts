/** Runs async tasks with at most `limit` running concurrently, preserving the result order. */
export async function runWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let nextIndex = 0

  async function runNext(): Promise<void> {
    const index = nextIndex++
    if (index >= items.length) return
    results[index] = await worker(items[index] as T, index)
    await runNext()
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runNext())
  await Promise.all(workers)
  return results
}
