import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CACHE_TTL = 60 * 60 * 2; // 2 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaType: string; id: string; season_number: string; episode_number: string }> }
) {
  const { id, mediaType, season_number, episode_number } = await params;

  if (!id || !mediaType || !season_number || !episode_number) {
    return NextResponse.json(
      { error: "Missing id, mediaType, season_number, or episode_number" },
      { status: 400 }
    );
  }

  if (mediaType !== 'tv') {
    return NextResponse.json(
      { error: "This endpoint is only for TV shows" },
      { status: 400 }
    );
  }

  const cacheKey = `tv:details:${id}:season:${season_number}:episode:${episode_number}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      return NextResponse.json(JSON.parse(cached));
    }
  } catch (e) {
    console.error("Redis cache read error:", e);
  }
  
  const endpoint = `/tv/${id}/season/${season_number}/episode/${episode_number}?language=en-US`;
  
  try {
    const url = `${TMDB_BASE_URL}${endpoint}${
      endpoint.includes("?") ? "&" : "?"
    }api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`TMDB fetch failed: ${endpoint}`);
    }

    const episodeDetails = await res.json();

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(episodeDetails));
    return NextResponse.json(episodeDetails);
  } catch (err) {
    console.error(`Error in GET handler for ${endpoint}:`, err);
    return NextResponse.json(
      { error: `Failed to fetch episode details for tv/${id}/season/${season_number}/episode/${episode_number}` },
      { status: 500 }
    );
  }
}