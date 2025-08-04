import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const id = url.searchParams.get("id");
  const media_type = url.searchParams.get("media_type");
  const mediaType = media_type; // forward as camelCase
  console.log("[details API] id:", id, "media_type:", media_type);

  if (!id || !media_type) {
    return NextResponse.json(
      { error: "Missing id or media_type" },
      { status: 400 }
    );
  }

  // Proxy to the correct dynamic route
  const apiUrl = `${url.origin}/api/home/details/${mediaType}/${id}?id=${id}&mediaType=${mediaType}`;
  try {
    const res = await fetch(apiUrl, { method: "GET" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch details" },
      { status: 500 }
    );
  }
}
