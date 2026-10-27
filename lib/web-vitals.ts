/**
 * Real visitors' Core Web Vitals, as a Plausible custom event
 * (components/web-vitals.tsx, docs/MEASUREMENT.md). Pure: the component
 * hands in what it read from the page and these functions decide what goes.
 *
 * One "Web Vitals" event per metric per sampled page load, for LCP, INP and
 * CLS only, with props Plausible can break down by:
 *   metric    LCP | INP | CLS
 *   rating    good | needs-improvement | poor (Google's thresholds)
 *   value     a bucket ("2.0-2.5s"), since Plausible counts props, it doesn't average them
 *   template  the route the visit landed on ("/neighborhoods/[slug]")
 *   device    phone | tablet | desktop, by the viewport's width
 *   pixel     on | off: whether Home Platform's lead pixel was running
 *
 * A sample of page loads reports (VITALS_SAMPLE_RATE), because every event
 * counts toward the Plausible plan's monthly total.
 */

export type VitalName = "LCP" | "INP" | "CLS";
export const VITALS: readonly VitalName[] = ["LCP", "INP", "CLS"];

/** The share of page loads that report: about 3 events per sampled load, so 10% adds at most a third to the plan's count. */
export const VITALS_SAMPLE_RATE = 0.1;

export const VITALS_EVENT = "Web Vitals";

const isVital = (name: string): name is VitalName => (VITALS as readonly string[]).includes(name);

/** Upper edges of each bucket. LCP and INP in milliseconds, CLS unitless. The last bucket is open. */
const EDGES: Record<VitalName, number[]> = {
  LCP: [1000, 1500, 2000, 2500, 3000, 4000],
  INP: [100, 200, 300, 500],
  CLS: [0.02, 0.05, 0.1, 0.25],
};

const label = (name: VitalName, v: number): string => (name === "LCP" ? `${(v / 1000).toFixed(1)}s` : name === "INP" ? `${v}ms` : v.toFixed(2));
const unit = (name: VitalName) => (name === "LCP" ? "s" : name === "INP" ? "ms" : "");

/** "2.0-2.5s", "0-100ms", "0.25+": the bucket a value falls in, upper edge included. */
export function vitalBucket(name: VitalName, value: number): string {
  const edges = EDGES[name];
  let lower = 0;
  for (const edge of edges) {
    if (value <= edge) {
      const lo = lower === 0 ? "0" : label(name, lower).replace(/[a-z]+$/, "");
      return `${lo}-${label(name, edge)}`;
    }
    lower = edge;
  }
  return `${label(name, lower).replace(/[a-z]+$/, "")}${unit(name)}+`;
}

/** phone under 768px wide, tablet under 1200px, desktop from there. */
export function deviceClass(width: number): "phone" | "tablet" | "desktop" {
  if (width < 768) return "phone";
  if (width < 1200) return "tablet";
  return "desktop";
}

/**
 * The route a path belongs to, from the dynamic params Next resolved for it:
 * "/neighborhoods/lakewood-ranch" with { slug: "lakewood-ranch" } becomes
 * "/neighborhoods/[slug]". Never the path itself, which can name a street.
 */
export function routeTemplate(pathname: string, params: Record<string, string | string[] | undefined> | null | undefined): string {
  const segments = pathname.split("/").filter(Boolean);
  const byValue = new Map<string, string>();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string") byValue.set(decodeURIComponent(value), `[${key}]`);
    else if (Array.isArray(value)) for (const v of value) byValue.set(decodeURIComponent(v), `[...${key}]`);
  }
  const out: string[] = [];
  for (const raw of segments) {
    let seg = raw;
    try {
      seg = decodeURIComponent(raw);
    } catch {
      // keep it as it came
    }
    const name = byValue.get(seg);
    // A catch-all's segments collapse into one.
    if (name && out[out.length - 1] === name && name.startsWith("[...")) continue;
    out.push(name ?? seg);
  }
  return `/${out.join("/")}`;
}

export type VitalMetric = { name: string; value: number; rating?: string; id: string; navigationType?: string };

export type VitalEventProps = { metric: VitalName; rating: string; value: string; template: string; device: string; pixel: "on" | "off" };

/**
 * The props for one metric, or null when it isn't reported: not LCP, INP or
 * CLS, or measured after a client-side navigation (only the page the visit
 * landed on is measured, so the template is the one that loaded).
 */
export function vitalEvent(metric: VitalMetric, page: { template: string; width: number; pixel: boolean }): VitalEventProps | null {
  if (!isVital(metric.name)) return null;
  if (metric.navigationType === "soft-navigation") return null;
  if (!Number.isFinite(metric.value) || metric.value < 0) return null;
  return {
    metric: metric.name,
    rating: metric.rating ?? "unknown",
    value: vitalBucket(metric.name, metric.name === "CLS" ? metric.value : Math.round(metric.value)),
    template: page.template,
    device: deviceClass(page.width),
    pixel: page.pixel ? "on" : "off",
  };
}

/** The body Plausible's own script posts to /api/event, with the props. */
export function plausiblePayload(props: VitalEventProps, page: { url: string; domain: string; referrer: string | null }): string {
  return JSON.stringify({ n: VITALS_EVENT, u: page.url, d: page.domain, r: page.referrer, p: props });
}
