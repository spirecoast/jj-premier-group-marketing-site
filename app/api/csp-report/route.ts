import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Bodies above this are dropped unread; a real report is a few hundred bytes. */
const MAX_BODY_BYTES = 16 * 1024;

type Summary = { directive?: string; blocked?: string; document?: string; line?: number; sample?: string };

/** Legacy `application/csp-report` shape: `{ "csp-report": { ... } }`. */
function fromLegacy(report: Record<string, unknown>): Summary {
  return {
    directive: str(report["effective-directive"] ?? report["violated-directive"]),
    blocked: str(report["blocked-uri"]),
    document: str(report["document-uri"]),
    line: num(report["line-number"]),
    sample: str(report["script-sample"]),
  };
}

/** Reporting API shape (`application/reports+json`): `[{ type: "csp-violation", body: { ... } }]`. */
function fromReportingApi(body: Record<string, unknown>): Summary {
  return {
    directive: str(body["effectiveDirective"]),
    blocked: str(body["blockedURL"]),
    document: str(body["documentURL"]),
    line: num(body["lineNumber"]),
    sample: str(body["sample"]),
  };
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v.slice(0, 300) : undefined;
}
function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Where the report-only Content-Security-Policy sends violations
 * (next.config.ts). Each one becomes a single warning line so it is easy to
 * read in the Vercel logs. Nothing is stored and nothing is answered beyond
 * 204; malformed or oversized bodies are ignored the same way.
 */
export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

  let text: string;
  try {
    text = await request.text();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const summaries: Summary[] = [];
  if (isRecord(parsed) && isRecord(parsed["csp-report"])) {
    summaries.push(fromLegacy(parsed["csp-report"]));
  } else if (Array.isArray(parsed)) {
    for (const item of parsed.slice(0, 20)) {
      if (isRecord(item) && item["type"] === "csp-violation" && isRecord(item["body"])) {
        summaries.push(fromReportingApi(item["body"]));
      }
    }
  }

  for (const s of summaries) {
    const parts = [
      `directive=${s.directive ?? "?"}`,
      `blocked=${s.blocked ?? "?"}`,
      `document=${s.document ?? "?"}`,
      s.line !== undefined ? `line=${s.line}` : null,
      s.sample ? `sample=${JSON.stringify(s.sample.slice(0, 80))}` : null,
    ].filter(Boolean);
    console.warn(`[csp-report] ${parts.join(" ")}`);
  }

  return new NextResponse(null, { status: 204 });
}
