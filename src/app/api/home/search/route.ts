// TMDB API base URL configurable via env
const TMDB_API_BASE_URL =
  process.env.TMDB_API_BASE_URL || "https://api.themoviedb.org/3";

import { NextResponse } from "next/server";
import redis from "@/lib/redis";

// Raw TMDB API movie type
interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}

// Transformed card type for frontend
interface PosterCard {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
}

function movieToPosterCard(movie: TMDBMovie): PosterCard {
  return {
    id: movie.id,
    title: movie.title,
    image: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,
    year: movie.release_date ? movie.release_date.slice(0, 4) : null,
    rating: movie.vote_average,
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

    const url = `${TMDB_API_BASE_URL}/trending/movie/day?language=en-US&page=${page}&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("TMDB API error:", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to fetch trending movies" },
        { status: 500 }
      );
    }
    const data = await res.json();
    const movies: TMDBMovie[] = data.results || [];
    const posterCards: PosterCard[] = movies
      .filter((m) => m.poster_path)
      .map(movieToPosterCard);
    const response = {
      trending: posterCards,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      hasNextPage: data.page < data.total_pages,
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
