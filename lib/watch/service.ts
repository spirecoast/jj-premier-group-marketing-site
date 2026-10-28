import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { newsletterDeliveries } from "@/lib/db/schema";
import { checkFairHousing } from "@/lib/fair-housing";
import { failureStatus, remainingToday } from "@/lib/newsletter/batch";
import { listUnsubscribeHeaders, watchSigningId, watchUnsubscribeLinks } from "@/lib/newsletter/headers";
import { sendOne } from "@/lib/newsletter/resend";
import {
  CONFIRMATIONS_PER_HOUR,
  activeConfig,
  confirmationsLastHour,
  footerForEmail,
  isSuppressed,
  logConfirmationCap,
  logEvent,
  usedToday,
} from "@/lib/newsletter/service";
import { transition, type SubscriptionState } from "@/lib/newsletter/state";
import { CONFIRM_TTL_SECONDS, signToken, verifyToken, type WatchConfirmPayload } from "@/lib/newsletter/token";
import { opsAlert } from "@/lib/ops/alert";
import { formatSaleAddress, getNewSales, median, placeMatcher, rollChanged, saleKey, streetSales, throughDates, type County, type Sale } from "@/lib/sales";
import { site } from "@/lib/site";
import { signUnsubscribe } from "@/lib/unsubscribe";
import { digestEmail, watchConfirmationEmail, type DigestSection } from "./emails";
import { softWatch, toWatch, watchById, watchByTarget, watchHousekeeping, type WatchRow } from "./store";
import { onStreet, tideStreetPath, type WatchTarget } from "./target";

/**
 * Street Watch, the server half (docs/ISSUES.md, "Street Watch"): a watch
 * asked for on a form, its double opt-in, and the digest of new county
 * sales after each refresh. It runs on the newsletter's machinery: the same
 * state machine (lib/newsletter/state.ts), the same confirm-link signing,
 * the same unsubscribe signing and pages, the same suppression record, and
 * the same daily cap (each confirmation and digest is a newsletter_deliveries
 * row, list 'watch'). Nothing here throws to a visitor.
 */

const log = (...a: unknown[]) => console.info("[watch]", ...a);
const warn = (...a: unknown[]) => console.error("[watch]", ...a);

const stateOf = (w: WatchRow | null): SubscriptionState => (w ? { status: w.status, confirmationSentAt: w.confirmationSentAt, welcomeSentAt: w.confirmedAt } : null);

export type WatchOutcome = { outcome: string; confirmationSent: boolean };

/**
 * After the Watch form is captured (lib/lead-pipeline.ts): record the watch
 * as pending and send the confirmation when the state machine says to.
 * Null when subscriber email is off (a preview, or before launch): the lead
 * and the team's email still carry the request. Never throws.
 */
export async function requestWatch(input: { contactId: string | null; email: string; target: WatchTarget; source: string | null; consentVersion: string; test?: boolean }): Promise<WatchOutcome | null> {
  if (input.test) return null;
  const config = activeConfig("street watch");
  if (!config) return null;
  const email = input.email.trim().toLowerCase();
  const t0 = input.target;
  try {
    const db = getDb();
    const now = new Date();
    const existing = await watchByTarget(email, t0.key);
    const t = transition(stateOf(existing), "request", { suppressed: await isSuppressed(email), now });
    let id = existing?.id ?? null;
    if (t.next) {
      const fresh = existing?.status === "unsubscribed";
      const rows = (await db.execute(sql`
        INSERT INTO street_watches (contact_id, email, kind, target_key, label, street, zip, place_slug, status, source, consent_version, requested_at)
        VALUES (${input.contactId}::uuid, ${email}, ${t0.kind}, ${t0.key}, ${t0.label}, ${t0.kind === "street" ? t0.street : null}, ${t0.kind === "street" ? t0.zip : null},
                ${t0.kind === "place" ? t0.slug : null}, ${t.next}, ${input.source}, ${input.consentVersion}, ${now.toISOString()}::timestamptz)
        ON CONFLICT (email, target_key) DO UPDATE SET
          contact_id = coalesce(excluded.contact_id, street_watches.contact_id),
          label = excluded.label,
          status = excluded.status,
          source = excluded.source,
          consent_version = excluded.consent_version,
          requested_at = excluded.requested_at,
          updated_at = now()
          ${fresh ? sql`, confirmed_at = NULL, unsubscribed_at = NULL, unsubscribe_method = NULL, last_digest_at = NULL` : sql``}
        RETURNING id`)) as unknown as { id: string }[];
      id = rows[0]?.id ?? id;
    }
    let sent = false;
    const overCap = t.send === "confirmation" && (await confirmationsLastHour(now)) >= CONFIRMATIONS_PER_HOUR;
    if (overCap) logConfirmationCap(now);
    if (t.send === "confirmation" && id && !overCap) {
      const token = signToken({ p: "watch", w: id }, config.secret, CONFIRM_TTL_SECONDS, now);
      const content = watchConfirmationEmail({ label: t0.label, confirmUrl: `${site.url}/watch/confirm?t=${token}`, footer: await footerForEmail(), ttlDays: Math.round(CONFIRM_TTL_SECONDS / 86_400) });
      const res = await sendOne(
        { from: config.from, to: email, subject: content.subject, html: content.html, text: content.text, replyTo: config.replyTo, tags: [{ name: "list", value: "watch" }, { name: "kind", value: "confirmation" }] },
        { apiKey: config.apiKey, idempotencyKey: `watch-confirm-${id}-${now.getTime()}` },
      );
      await db
        .insert(newsletterDeliveries)
        .values({ kind: "confirmation", list: "watch", email, status: res.ok ? "sent" : failureStatus(res.httpStatus), attempts: Math.max(1, res.attempts), resendId: res.ok ? (res.ids[0] ?? null) : null, error: res.ok ? null : res.error.slice(0, 1000), sentAt: res.ok ? now : null })
        .catch((err: unknown) => warn("couldn't record the confirmation", err instanceof Error ? err.message : err));
      if (res.ok) {
        sent = true;
        await db.execute(sql`UPDATE street_watches SET confirmation_sent_at = ${now.toISOString()}::timestamptz, updated_at = now() WHERE id = ${id}::uuid`);
      } else warn(`confirmation not sent (${res.httpStatus ?? "no answer"}): ${res.error}`);
    }
    await logEvent("street_watch_requested", input.contactId, { kind: t0.kind, target: t0.key, outcome: t.outcome, confirmation_sent: sent });
    log(`${t0.kind}: ${t.outcome}${sent ? ", confirmation sent" : ""}`);
    return { outcome: t.outcome, confirmationSent: sent };
  } catch (err) {
    softWatch("street_watches", err);
    return null;
  }
}

/* ---- Confirming --------------------------------------------------------------- */

export type WatchConfirmView = { state: "ready" | "already" | "unsubscribed"; label: string; path: string } | { state: "invalid" } | { state: "off" };

function targetOf(w: WatchRow): WatchTarget {
  return w.kind === "street" ? { kind: "street", street: w.street ?? "", zip: w.zip ?? "", key: w.targetKey, label: w.label } : { kind: "place", slug: w.placeSlug ?? "", name: w.label, key: w.targetKey, label: w.label };
}

async function watchForToken(token: string | null | undefined, secret: string): Promise<WatchRow | null> {
  const v = verifyToken<WatchConfirmPayload>(token, secret, "watch");
  if (!v.ok) return null;
  return watchById(v.data.w);
}

/** What /watch/confirm shows before the button is pressed. */
export async function viewWatchConfirm(token: string | null | undefined): Promise<WatchConfirmView> {
  const config = activeConfig("watch confirm page");
  if (!config) return { state: "off" };
  const w = await watchForToken(token, config.secret);
  if (!w) return { state: "invalid" };
  const path = tideStreetPath(targetOf(w));
  if (w.status === "unsubscribed" || (await isSuppressed(w.email).catch(() => false))) return { state: "unsubscribed", label: w.label, path };
  return { state: w.status === "confirmed" ? "already" : "ready", label: w.label, path };
}

export type WatchConfirmResult = { ok: true; state: "confirmed" | "already" | "unsubscribed"; label: string; path: string } | { ok: false; state: "invalid" | "off" | "error" };

/** The confirm button: records the opt-in. Street Watch sends no welcome; the first digest is the next email. */
export async function confirmWatch(token: string | null | undefined): Promise<WatchConfirmResult> {
  const config = activeConfig("watch confirm");
  if (!config) return { ok: false, state: "off" };
  try {
    const w = await watchForToken(token, config.secret);
    if (!w) return { ok: false, state: "invalid" };
    const path = tideStreetPath(targetOf(w));
    const now = new Date();
    const t = transition(stateOf(w), "confirm", { suppressed: await isSuppressed(w.email), now });
    if (t.outcome === "suppressed" || t.outcome === "not_pending") return { ok: true, state: "unsubscribed", label: w.label, path };
    if (t.next === "confirmed") {
      // Only a pending row turns confirmed, so two presses record it once.
      const rows = (await getDb().execute(sql`
        UPDATE street_watches SET status = 'confirmed', confirmed_at = ${now.toISOString()}::timestamptz, updated_at = now()
         WHERE id = ${w.id}::uuid AND status = 'pending' RETURNING id`)) as unknown as unknown[];
      if (rows.length) await logEvent("street_watch_confirmed", w.contactId, { target: w.targetKey, confirmed_at: now.toISOString(), method: "double_opt_in" });
      return { ok: true, state: "confirmed", label: w.label, path };
    }
    return { ok: true, state: "already", label: w.label, path };
  } catch (err) {
    softWatch("street_watches", err);
    return { ok: false, state: "error" };
  }
}

/** The label the unsubscribe page puts on its button; null when unknown. */
export async function watchLabel(id: string): Promise<string | null> {
  return (await watchById(id))?.label ?? null;
}

/* ---- The digest ----------------------------------------------------------------- */

/** One digest per address at most this often, whatever the refreshes do. */
export const DIGEST_MIN_GAP_MS = 6 * 86_400_000;
/** Sales listed per watch before "and N more". */
export const DIGEST_ROWS = 8;
/** Stop starting new digests after this long in one request (the route allows 60 seconds). */
export const DIGEST_BUDGET_MS = 40_000;
const MAX_ATTEMPTS = 3;
const COUNTY_NAME: Record<County, string> = { manatee: "Manatee", sarasota: "Sarasota" };

export type DigestRun = {
  ok: boolean;
  enabled: boolean;
  version: string | null;
  watches: number;
  addresses: number;
  sent: number;
  failed: number;
  held: number;
  deferred: number;
  nothingNew: number;
  housekeeping?: Awaited<ReturnType<typeof watchHousekeeping>>;
  note?: string;
};

/** The 12-month median resale over a set of sales, read back from the county's newest date; null with fewer than three. */
function median12(rows: Sale[], newest: string): { value: number; count: number } | null {
  const [y, m, d] = newest.split("-").map(Number) as [number, number, number];
  const since = new Date(Date.UTC(y - 1, m - 1, d)).toISOString().slice(0, 10);
  const prices = rows.filter((r) => r.saleDate >= since && r.propertyUse !== "vacant").map((r) => r.salePrice);
  return prices.length >= 3 ? { value: Math.round(median(prices) as number), count: prices.length } : null;
}

const asDigestSale = (r: Sale) => ({
  address: formatSaleAddress(r)
    .split(" ")
    .map((w) => (/^\d/.test(w) || /^(N|S|E|W|NE|NW|SE|SW)$/.test(w) ? w.toLowerCase().replace(/^(n|s|e|w|ne|nw|se|sw)$/, (x) => x.toUpperCase()) : w.charAt(0) + w.slice(1).toLowerCase()))
    .join(" "),
  saleDate: r.saleDate,
  salePrice: r.salePrice,
  pricePerSqft: r.livingArea && r.propertyUse !== "vacant" && !rollChanged(r) ? Math.round(r.salePrice / r.livingArea) : null,
  newBuild: r.propertyUse === "vacant",
});

/**
 * The daily Street Watch run (/api/cron/street-watch): after a sales
 * refresh is merged and deployed, one digest per address with the sales new
 * since the refresh before, for every confirmed watch that has any. A watch
 * confirmed after the refresh was generated waits for the next one (its
 * sales were already on the page when they pressed Watch). Safe to re-run
 * and to run twice at once: each address is claimed per data version.
 */
export async function runWatchDigests(now = new Date()): Promise<DigestRun> {
  const base: DigestRun = { ok: true, enabled: false, version: null, watches: 0, addresses: 0, sent: 0, failed: 0, held: 0, deferred: 0, nothingNew: 0 };
  const housekeeping = await watchHousekeeping();
  const config = activeConfig("street watch digest");
  if (!config) return { ...base, housekeeping, note: "subscriber email is off" };
  const file = await getNewSales();
  if (!file) return { ...base, enabled: true, housekeeping, note: "no new-sales file" };
  const version = file.generatedAt;
  const run: DigestRun = { ...base, enabled: true, version, housekeeping };
  if (!file.rows.length) return { ...run, note: "no new sales in this refresh" };

  let watches: WatchRow[];
  try {
    watches = (
      (await getDb().execute(sql`
        SELECT w.id, w.contact_id, w.email, w.kind, w.target_key, w.label, w.street, w.zip, w.place_slug, w.status,
               w.confirmation_sent_at, w.confirmed_at, w.unsubscribed_at, w.last_digest_at
          FROM street_watches w
         WHERE w.status = 'confirmed' AND w.confirmed_at < ${version}::timestamptz
           AND NOT EXISTS (SELECT 1 FROM contacts c WHERE lower(c.email) = w.email AND c.unsubscribed_email)
           AND NOT EXISTS (SELECT 1 FROM street_watch_digests g WHERE g.email = w.email AND g.data_version = ${version}
                            AND (g.status IN ('sent', 'claimed', 'unknown', 'held') OR g.attempts >= ${MAX_ATTEMPTS}))
         ORDER BY w.email, w.confirmed_at`)) as unknown as Parameters<typeof toWatch>[0][]
    ).map(toWatch);
  } catch (err) {
    softWatch("street_watches", err);
    return { ...run, ok: false, note: "couldn't read the watches" };
  }
  run.watches = watches.length;
  if (!watches.length) return run;

  const through = await throughDates();
  const byEmail = new Map<string, WatchRow[]>();
  for (const w of watches) byEmail.set(w.email, [...(byEmail.get(w.email) ?? []), w]);
  run.addresses = byEmail.size;
  const matchers = new Map<string, Awaited<ReturnType<typeof placeMatcher>>>();
  const deadline = Date.now() + DIGEST_BUDGET_MS;
  const footer = await footerForEmail();
  const campaign = `watch-${version.slice(0, 10)}`;

  for (const [email, list] of byEmail) {
    if (Date.now() > deadline) {
      run.deferred += 1;
      continue;
    }
    // One digest a week per address, whatever the refreshes do.
    const last = list.reduce<number>((t, w) => Math.max(t, w.lastDigestAt?.getTime() ?? 0), 0);
    if (now.getTime() - last < DIGEST_MIN_GAP_MS) {
      run.deferred += 1;
      continue;
    }

    const sections: (DigestSection & { watchId: string; counties: County[] })[] = [];
    for (const w of list) {
      let hits: Sale[] = [];
      let context: Sale[] = [];
      let zipBasis: string[] | null = null;
      if (w.kind === "street" && w.street && w.zip) {
        const target = { kind: "street" as const, street: w.street, zip: w.zip, key: w.targetKey, label: w.label };
        hits = file.rows.filter((r) => onStreet(target, r));
        if (hits.length) context = await streetSales(w.street, w.zip);
      } else if (w.kind === "place" && w.placeSlug) {
        if (!matchers.has(w.placeSlug)) matchers.set(w.placeSlug, await placeMatcher(w.placeSlug).catch(() => null));
        const m = matchers.get(w.placeSlug);
        if (m?.basis === "joined") hits = file.rows.filter((r) => m.keys.has(saleKey(r)));
        else if (m?.basis === "zip") {
          const zips = new Set(m.zips);
          hits = file.rows.filter((r) => zips.has(r.zip));
          zipBasis = m.zips;
        }
        context = m?.rows ?? [];
      }
      if (!hits.length) continue;
      const counties = [...new Set(hits.map((r) => r.county))];
      const newest = counties.map((c) => through[c] ?? "").sort().pop() || hits[0]!.saleDate;
      const target: WatchTarget = w.kind === "street" ? { kind: "street", street: w.street!, zip: w.zip!, key: w.targetKey, label: w.label } : { kind: "place", slug: w.placeSlug!, name: w.label, key: w.targetKey, label: w.label };
      const links = watchUnsubscribeLinks(site.url, w.id, signUnsubscribe(watchSigningId(w.id)));
      sections.push({
        watchId: w.id,
        counties,
        label: w.label,
        kind: w.kind,
        sales: hits.slice(0, DIGEST_ROWS).map(asDigestSale),
        more: Math.max(0, hits.length - DIGEST_ROWS),
        median: median12(context, newest),
        zipBasis,
        openUrl: `${site.url}${tideStreetPath(target)}`,
        stopUrl: links.one,
      });
    }
    if (!sections.length) {
      run.nothingNew += 1;
      continue;
    }

    const room = remainingToday(config.dailyCap, await usedToday(new Date()));
    if (room === 0) {
      run.deferred += 1;
      continue;
    }

    const first = watchUnsubscribeLinks(site.url, sections[0]!.watchId, signUnsubscribe(watchSigningId(sections[0]!.watchId)));
    const counties = [...new Set(sections.flatMap((s) => s.counties))];
    const content = digestEmail({
      sections,
      through: counties.filter((c) => through[c]).map((c) => ({ county: COUNTY_NAME[c], to: through[c]! })),
      footer,
      links: { watches: first.watches, all: first.all },
      campaign,
    });
    const salesCount = sections.reduce((n, s) => n + s.sales.length + s.more, 0);
    const summary = JSON.stringify(sections.map((s) => ({ id: s.watchId, label: s.label, sales: s.sales.length + s.more })));
    const fh = checkFairHousing(`${content.subject}\n${content.html}\n${content.text}`);
    const status = fh.passed ? "claimed" : "held";

    const db = getDb();
    let claimed: { id: string }[] = [];
    try {
      claimed = (await db.execute(sql`
        INSERT INTO street_watch_digests (email, data_version, status, watches, sales)
        VALUES (${email}, ${version}, ${status}, ${summary}::jsonb, ${salesCount})
        ON CONFLICT (email, data_version) DO UPDATE SET status = excluded.status, attempts = street_watch_digests.attempts + 1, error = NULL, watches = excluded.watches, sales = excluded.sales
         WHERE street_watch_digests.status = 'failed' AND street_watch_digests.attempts < ${MAX_ATTEMPTS}
        RETURNING id`)) as unknown as { id: string }[];
    } catch (err) {
      softWatch("street_watch_digests", err);
      return { ...run, ok: false, note: "couldn't claim a digest" };
    }
    const digestId = claimed[0]?.id;
    if (!digestId) continue;
    if (!fh.passed) {
      run.held += 1;
      warn(`digest held for Fair Housing review (${version})`);
      await opsAlert({
        key: `street-watch-fair-housing:${version}`,
        subject: "A Street Watch digest was held by the Fair Housing checker",
        lines: ["The Fair Housing checker flagged a Street Watch digest, so it wasn't sent. Every sentence in it comes from lib/watch/copy.ts and the county record; check what the checker matched and fix the copy.", `Data version ${version}.`],
        detail: fh.passed ? undefined : JSON.stringify(fh.flags).slice(0, 2000),
      }).catch(() => undefined);
      continue;
    }

    const [delivery] = await db
      .insert(newsletterDeliveries)
      .values({ kind: "issue", list: "watch", email, status: "claimed", attempts: 1 })
      .returning({ id: newsletterDeliveries.id })
      .catch(() => [] as { id: string }[]);
    const res = await sendOne(
      {
        from: config.from,
        to: email,
        subject: content.subject,
        html: content.html,
        text: content.text,
        replyTo: config.replyTo,
        headers: listUnsubscribeHeaders(first.oneClick, config.replyTo),
        tags: [
          { name: "list", value: "watch" },
          { name: "kind", value: "digest" },
          { name: "campaign", value: campaign },
        ],
      },
      { apiKey: config.apiKey, idempotencyKey: `watch-digest-${digestId}` },
    );
    const at = new Date();
    const outcome = res.ok ? "sent" : failureStatus(res.httpStatus);
    await db.execute(sql`
      UPDATE street_watch_digests SET status = ${outcome}, resend_id = ${res.ok ? (res.ids[0] ?? null) : null}, error = ${res.ok ? null : res.error.slice(0, 1000)},
             sent_at = ${res.ok ? at.toISOString() : null}::timestamptz
       WHERE id = ${digestId}::uuid`);
    if (delivery) {
      await db
        .execute(sql`UPDATE newsletter_deliveries SET status = ${outcome}, resend_id = ${res.ok ? (res.ids[0] ?? null) : null}, error = ${res.ok ? null : res.error.slice(0, 1000)}, sent_at = ${res.ok ? at.toISOString() : null}::timestamptz WHERE id = ${delivery.id}::uuid`)
        .catch(() => undefined);
    }
    if (res.ok) {
      run.sent += 1;
      const ids = sections.map((s) => s.watchId);
      await db.execute(sql`UPDATE street_watches SET last_digest_at = ${at.toISOString()}::timestamptz, updated_at = now() WHERE id IN (${sql.join(
        ids.map((id) => sql`${id}::uuid`),
        sql`, `,
      )})`);
    } else {
      run.failed += 1;
      warn(`digest ${outcome} (${res.httpStatus ?? "no answer"}): ${res.error}`);
      // A refusal (rate limit, the day's quota) would repeat for every address: stop here, tomorrow's run picks it up.
      break;
    }
  }
  log(`digests for ${version}: ${run.sent} sent, ${run.failed} failed, ${run.held} held, ${run.deferred} deferred, ${run.nothingNew} with nothing new`);
  return { ...run, ok: run.failed === 0 };
}
