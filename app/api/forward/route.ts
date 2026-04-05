import { NextResponse } from "next/server";

function searchParamsToJson(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    out[key] = values.length === 1 ? values[0]! : values;
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Query params are strings; treat "true" (case-insensitive) as available. */
function isAvailabilityTrue(raw: string): boolean {
  if (raw === "—") return false;
  return raw.trim().toLowerCase() === "true";
}

function corsHeaders(): HeadersInit {
  const origin = process.env.FORWARD_CORS_ORIGIN ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function resultPage(options: {
  ok: boolean;
  recordId: string;
  availability: string;
  message?: string;
}): string {
  const { ok, recordId, availability, message } = options;
  const available = isAvailabilityTrue(availability);

  const title = ok
    ? available
      ? "All set"
      : "Thank you"
    : "Something went wrong";

  const subtitle = ok
    ? available
      ? "We've marked you as available for this assignment. Someone will reach out shortly with more details."
      : "Thank you for your response. We have marked you as unavailable for this assignment. We will catch you on the next one."
    : (message ?? "We could not complete the request. Please try again.");

  const accent = ok ? "#16a34a" : "#dc2626";
  const accentSoft = ok ? "#f0fdf4" : "#fef2f2";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #fafafa;
      --card: #ffffff;
      --text: #18181b;
      --muted: #71717a;
      --border: #e4e4e7;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090b;
        --card: #18181b;
        --text: #fafafa;
        --muted: #a1a1aa;
        --border: #27272a;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      width: 100%;
      max-width: 28rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .icon {
      width: 3rem;
      height: 3rem;
      border-radius: 9999px;
      background: ${accentSoft};
      color: ${accent};
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    h1 {
      font-size: 1.375rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0 0 0.5rem;
    }
    .sub {
      font-size: 0.9375rem;
      color: var(--muted);
      line-height: 1.5;
      margin: 0 0 1.5rem;
    }
    dl {
      margin: 0;
      padding: 0;
      border-top: 1px solid var(--border);
    }
    .row {
      display: grid;
      grid-template-columns: 7rem 1fr;
      gap: 0.75rem 1rem;
      padding: 0.875rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }
    .row:last-child { border-bottom: none; }
    dt {
      margin: 0;
      color: var(--muted);
      font-weight: 500;
    }
    dd {
      margin: 0;
      word-break: break-word;
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon" aria-hidden="true">
      ${
        ok
          ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
          : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`
      }
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p class="sub">${escapeHtml(subtitle)}</p>
    <dl>
      <div class="row"><dt>Record</dt><dd>${escapeHtml(recordId)}</dd></div>
      <div class="row"><dt>Availability</dt><dd>${escapeHtml(availability)}</dd></div>
    </dl>
  </div>
</body>
</html>`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const target = process.env.FORWARD_POST_URL;
  const { searchParams } = new URL(request.url);

  const recordId = searchParams.get("record_id") ?? "—";
  const availability = searchParams.get("availability") ?? "—";

  if (!target) {
    const html = resultPage({
      ok: false,
      recordId,
      availability,
      message: "This service is not configured. Please contact support.",
    });
    return new NextResponse(html, {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const payload = searchParamsToJson(searchParams);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = request.headers.get("authorization");
  if (auth) {
    headers.Authorization = auth;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Upstream request failed";
    const html = resultPage({
      ok: false,
      recordId,
      availability,
      message: detail,
    });
    return new NextResponse(html, {
      status: 502,
      headers: { ...corsHeaders(), "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const ok = upstream.ok;
  const html = resultPage({
    ok,
    recordId,
    availability,
    message: ok ? undefined : `The server responded with status ${upstream.status}.`,
  });

  return new NextResponse(html, {
    status: ok ? 200 : upstream.status,
    headers: { ...corsHeaders(), "Content-Type": "text/html; charset=utf-8" },
  });
}
