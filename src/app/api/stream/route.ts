import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  if (!type || !id) {
    return NextResponse.json(
      { error: "Missing required parameters (type, id)" },
      { status: 400 }
    );
  }

  try {
    const backendUrl = new URL(
      "https://dandy-prime-puppeter.onrender.com/stream"
    );
    backendUrl.searchParams.append("type", type);
    backendUrl.searchParams.append("id", id);
    if (season) backendUrl.searchParams.append("season", season);
    if (episode) backendUrl.searchParams.append("episode", episode);

    const response = await fetch(backendUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch from backend" },
        { status: response.status }
      );
    }

    return NextResponse.json({ streamUrl: data.link });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
