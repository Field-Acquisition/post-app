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

function corsHeaders(): HeadersInit {
  const origin = process.env.FORWARD_CORS_ORIGIN ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const target = process.env.FORWARD_POST_URL;
  if (!target) {
    return NextResponse.json(
      { error: "FORWARD_POST_URL is not configured" },
      { status: 500, headers: corsHeaders() },
    );
  }

  const { searchParams } = new URL(request.url);
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
    return NextResponse.json(
      { error: "Failed to reach target", detail },
      { status: 502, headers: corsHeaders() },
    );
  }

  const text = await upstream.text();
  const contentType =
    upstream.headers.get("content-type") ?? "application/json";

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      ...corsHeaders(),
      "Content-Type": contentType,
    },
  });
}
