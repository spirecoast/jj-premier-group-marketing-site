import { roleForToken } from "@/lib/questionnaire/access";
import { compileCsv, compileMarkdown, exportFilename } from "@/lib/questionnaire/compile";
import { RESPONDENTS } from "@/lib/questionnaire/model";
import { loadAnswers } from "@/lib/questionnaire/store";

/**
 * GET /q/<admin token>/export?format=md|csv — both people's answers as one
 * file. Anything but the admin token gets a bare 404.
 */

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (roleForToken(token) !== "admin") {
    return new Response("Not found", { status: 404, headers: PRIVATE_HEADERS });
  }
  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "md";
  const { state, answers } = await loadAnswers([...RESPONDENTS]);
  if (state !== "ok") {
    const why = state === "missing" ? "The site’s database isn’t connected, so there’s nothing to download yet." : "The site’s database didn’t answer just now. Try again in a minute.";
    return new Response(why, { status: 503, headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" } });
  }
  const now = new Date();
  const body = format === "csv" ? compileCsv(answers) : compileMarkdown(answers, now);
  return new Response(body, {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(format, now)}"`,
    },
  });
}
