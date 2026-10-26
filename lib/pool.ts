export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  onDone?: (item: T, error: unknown | null) => void,
): Promise<{ failed: T[] }> {
  const failed: T[] = []
  let next = 0
  async function lane() {
    while (next < items.length) {
      const item = items[next++]
      try {
        await worker(item)
        onDone?.(item, null)
      } catch (e) {
        failed.push(item)
        onDone?.(item, e)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane))
  return { failed: items.filter((i) => failed.includes(i)) }
}
