// TMDB API base URL configurable via env
const TMDB_API_BASE_URL =
  process.env.TMDB_API_BASE_URL || "https://api.themoviedb.org/3";

import { NextResponse } from "next/server";
import redis from "@/lib/redis";

interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  vote_average?: number;
  media_type?: string;
}

interface PosterCard {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
  media_type: string;
}

function mapContent(item: ContentItem): PosterCard {
  return {
    id: item.id,
    title: item.title || item.name || "",
    image: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : null,
    year: item.release_date
      ? item.release_date.slice(0, 4)
      : item.first_air_date
      ? item.first_air_date.slice(0, 4)
      : null,
    rating: item.vote_average || 0,
    media_type: item.media_type || (item.title ? "movie" : "tv"),
  };
}

export const revalidate = 3600; // 1 hour cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const cacheKey = `trending:day:page:${page}`;
  try {
    // Try Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
        return NextResponse.json(parsed);
      } catch (err) {
        console.error("Failed to parse cached trending movies:", err);
        // Fallback to fetching fresh data
      }
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("TMDB_API_KEY is not set in environment variables.");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    // Fetch both trending movies and TV shows
    const movieUrl = `${TMDB_API_BASE_URL}/trending/movie/day?language=en-US&page=${page}&api_key=${apiKey}`;
    const tvUrl = `${TMDB_API_BASE_URL}/trending/tv/day?language=en-US&page=${page}&api_key=${apiKey}`;

    const [movieRes, tvRes] = await Promise.all([
      fetch(movieUrl),
      fetch(tvUrl)
    ]);

    if (!movieRes.ok || !tvRes.ok) {
      console.error("TMDB API error:", {
        movieStatus: movieRes.status,
        tvStatus: tvRes.status
      });
      return NextResponse.json(
        { error: "Failed to fetch trending content" },
        { status: 500 }
      );
    }

    const [movieData, tvData] = await Promise.all([
      movieRes.json(),
      tvRes.json()
    ]);

    const allContent = [
      ...(movieData.results || []).map((item: ContentItem) => ({
        ...item,
        media_type: "movie"
      })),
      ...(tvData.results || []).map((item: ContentItem) => ({
        ...item,
        media_type: "tv"
      }))
    ];

    const posterCards: PosterCard[] = allContent
      .filter((item) => item.poster_path)
      .map(mapContent);
    const response = {
      trending: posterCards,
      page: page,
      totalPages: Math.max(movieData.total_pages, tvData.total_pages),
      totalResults: (movieData.total_results || 0) + (tvData.total_results || 0),
      hasNextPage: page < Math.max(movieData.total_pages, tvData.total_pages),
    };
    // Cache in Redis for 1 hour (stringify for safety)
    await redis.set(cacheKey, JSON.stringify(response), { ex: 3600 });
    return NextResponse.json(response);
  } catch (e: unknown) {
    console.error("Trending movies endpoint error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
