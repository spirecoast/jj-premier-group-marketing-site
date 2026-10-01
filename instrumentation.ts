/**
 * Runs once per server start (Next.js instrumentation hook). The only job
 * today: say which lead sinks are on, and shout in production if none are.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { warnIfNoLeadSink } = await import("@/lib/lead-sinks");
  warnIfNoLeadSink();
}
