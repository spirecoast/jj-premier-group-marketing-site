import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withRetry } from "./retry";

describe("retrying a lazy load", () => {
  it("returns the first success without waiting", async () => {
    const waits: number[] = [];
    const v = await withRetry(async () => 7, { sleep: async (ms) => void waits.push(ms) });
    assert.equal(v, 7);
    assert.deepEqual(waits, []);
  });

  it("tries twice more with a growing pause, then succeeds", async () => {
    let calls = 0;
    const waits: number[] = [];
    const v = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error("chunk failed");
        return "ok";
      },
      { retries: 2, baseDelayMs: 100, sleep: async (ms) => void waits.push(ms) },
    );
    assert.equal(v, "ok");
    assert.equal(calls, 3);
    assert.deepEqual(waits, [100, 200]);
  });

  it("throws the last error after the retries run out", async () => {
    let calls = 0;
    await assert.rejects(
      withRetry(
        async () => {
          calls += 1;
          throw new Error(`fail ${calls}`);
        },
        { retries: 2, sleep: async () => {} },
      ),
      /fail 3/,
    );
    assert.equal(calls, 3);
  });
});
