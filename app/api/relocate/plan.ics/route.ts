import type { NextRequest } from "next/server";
import { planToIcs } from "@/lib/relocate/ics";
import { buildPlan } from "@/lib/relocate/plan";
import { parseAnswers, planPath } from "@/lib/relocate/url";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * GET /api/relocate/plan.ics?in=2027-02-15&path=buying&sell=no&from=NY&work=remote&county=manatee&fin=financed&off=3
 *
 * The six answers in the query, the plan as a calendar: one all-day event per
 * dated milestone, the basis and the source link in each description. The
 * same planner the page runs, so the dates always match.
 */
export async function GET(request: NextRequest) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const answers = parseAnswers(Object.fromEntries(request.nextUrl.searchParams), today);
  const plan = buildPlan(answers, today);
  const body = planToIcs(plan, { siteName: site.name, domain: site.domain, pageUrl: absoluteUrl(planPath(answers)), now });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="relocation-plan-${answers.moveInDate}.ics"`,
      "Cache-Control": "public, max-age=900, s-maxage=3600",
    },
  });
}
