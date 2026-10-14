/**
 * Runs in the browser before the app hydrates (Next.js instrumentation-client).
 * The only job today: start Sentry when this build has a DSN (lib/sentry/client.ts).
 */
import { loadSentry } from "@/lib/sentry/client";

void loadSentry();
