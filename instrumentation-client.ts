/**
 * Runs in the browser before the app hydrates (Next.js instrumentation-client).
 * Starts Sentry when this build has a DSN (lib/sentry/client.ts), and turns off
 * zod's JIT: on first use zod probes for it with `Function("")`, which the
 * Content-Security-Policy reports as an eval on every page (next.config.ts).
 * Validation is the same without it; the forms' schemas are small.
 */
import { config as zodConfig } from "zod";
import { loadSentry } from "@/lib/sentry/client";

zodConfig({ jitless: true });

void loadSentry();
