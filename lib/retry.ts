/**
 * Run `task`, and if it rejects, run it again up to `retries` more times with
 * a growing pause between tries. The last error is the one that's thrown.
 *
 * Used for lazy chunks: a chunk can fail on a dropped connection or a deploy
 * that swapped files mid-visit, and a second try a moment later usually works.
 */
export async function withRetry<T>(
  task: () => Promise<T>,
  { retries = 2, baseDelayMs = 400, sleep = defaultSleep }: { retries?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
