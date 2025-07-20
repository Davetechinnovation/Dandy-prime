import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const HERO_CACHE_KEY = "home:hero";
const HERO_CACHE_TTL = 1800; // 30 minutes
const HERO_COUNT = 10;
const FALLBACK_IMAGE = "/images/sinners.webp"; // You can change this to any local image
const TMDB_POPULAR_MOVIES_ENDPOINT = "/movie/popular?language=en-US&page=1";

interface HeroMovie {
  id: number | string;
  title: string;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number;
  vote_count: number;
  original_language: string;
  overview: string;
}

export async function GET() {
  try {
    // Try Redis cache first
    const cached = await redis.get(HERO_CACHE_KEY);
    if (typeof cached === "string" && cached) {
      try {
        const heroes = JSON.parse(cached);
        return NextResponse.json(heroes);
      } catch (error) {
        console.error("Error parsing cached data:", error);
        // If cache is corrupted, ignore and fetch fresh
      }
    }

    // Fetch the most popular movies using TMDB v3 API Key (query param)
    const res = await fetch(
      `${TMDB_BASE_URL}${TMDB_POPULAR_MOVIES_ENDPOINT}&api_key=${TMDB_API_KEY}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      console.error(`TMDB API error: ${res.status} ${res.statusText}`);
      throw new Error(`TMDB API error: ${res.status}`);
    }

    const data = await res.json();

    if (
      !data.results ||
      !Array.isArray(data.results) ||
      data.results.length === 0
    ) {
      console.warn("No movies found in TMDB response.");
      return NextResponse.json({ error: "No movies found" }, { status: 404 });
    }

    // Filter out movies with no backdrop_path (no image)
    const filtered = data.results.filter((movie: HeroMovie) => {
      return !!movie.backdrop_path;
    });

    // Pick HERO_COUNT random movies from the filtered list (no duplicates)
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, HERO_COUNT);

    // If not enough movies, fill with fallback
    if (selected.length < HERO_COUNT) {
      const missing = HERO_COUNT - selected.length;
      selected = [
        ...selected,
        ...Array(missing).fill({
          id: `fallback-${Math.random()}`,
          title: "No Title",
          backdrop_path: null,
          release_date: null,
          vote_average: 0,
          vote_count: 0,
          original_language: "en",
          overview: "No description available.",
        }),
      ];
    }

    // Build the response array, fallback to a default image if missing
    const heroes = selected
      .map((movie: HeroMovie) => ({
        id: movie.id,
        title: movie.title,
        image: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
          : FALLBACK_IMAGE,
        year: movie.release_date ? movie.release_date.split("-")[0] : null,
        rating: Number(movie.vote_average).toFixed(1),
        votes: movie.vote_count,
        language: movie.original_language,
        description: movie.overview,
      }))
      .filter((m: HeroMovie) => m.id && m.title);

    // Cache in Redis (Upstash: setex for atomic set+expire)
    await redis.setex(HERO_CACHE_KEY, HERO_CACHE_TTL, JSON.stringify(heroes));

    return NextResponse.json(heroes);
  } catch (error: unknown) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
