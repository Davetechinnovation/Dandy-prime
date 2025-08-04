import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_BASE_URL =
  process.env.TMDB_API_BASE_URL || "https://api.themoviedb.org/3";

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  vote_average: number;
  media_type?: string; // Added media_type field
}

interface PosterCard {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
  media_type: string; // Added media_type field
}

function resultToPosterCard(result: TMDBSearchResult, searchType: string): PosterCard {
  // Determine media_type: use TMDB's media_type if available, otherwise fallback to search type
  let mediaType = result.media_type;
  
  // If media_type is not provided or is "person", determine from other fields
  if (!mediaType || mediaType === "person") {
    if (result.title && result.release_date) {
      mediaType = "movie";
    } else if (result.name && result.first_air_date) {
      mediaType = "tv";
    } else {
      // Fallback to search type if still unclear
      mediaType = searchType === "multi" ? "movie" : searchType;
    }
  }

  return {
    id: result.id,
    title: result.title || result.name || "",
    image: result.poster_path
      ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
      : null,
    year:
      (result.release_date || result.first_air_date || "").slice(0, 4) || null,
    rating: result.vote_average,
    media_type: mediaType,
  };
}

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  let type = searchParams.get("type") || "multi"; // multi, movie, or tv
  if (type !== "movie" && type !== "tv" && type !== "multi") type = "multi";
  const page = parseInt(searchParams.get("page") || "1", 10);
  if (!query) {
    return NextResponse.json(
      { error: "Missing search query" },
      { status: 400 }
    );
  }
  const cacheKey = `search:${type}:${query}:page:${page}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
        return NextResponse.json(parsed);
      } catch (err) {
        console.error("Failed to parse cached search results:", err);
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
    const url = `${TMDB_API_BASE_URL}/search/${type}?query=${encodeURIComponent(
      query
    )}&language=en-US&page=${page}&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("TMDB search API error:", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to fetch search results" },
        { status: 500 }
      );
    }
    const data = await res.json();
    const results: TMDBSearchResult[] = data.results || [];
    const posterCards: PosterCard[] = results
      .filter((r) => r.poster_path)
      .map((result) => resultToPosterCard(result, type));
    const response = {
      results: posterCards,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      hasNextPage: data.page < data.total_pages,
    };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 3600 });
    return NextResponse.json(response);
  } catch (e: unknown) {
    console.error("Search endpoint error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
