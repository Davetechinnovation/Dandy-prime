import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const HERO_CACHE_KEY = "home:hero";
const HERO_CACHE_TTL = 1800; // 30 minutes

export async function GET() {
  // Try Redis cache first
  const cached = await redis.get(HERO_CACHE_KEY);
  if (typeof cached === "string" && cached) {
    try {
      const heroes = JSON.parse(cached);
      return NextResponse.json(heroes);
    } catch {
      // If cache is corrupted, ignore and fetch fresh
    }
  }

  // Fetch the most popular movies using TMDB v3 API Key (query param)
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/popular?language=en-US&page=1&api_key=${TMDB_API_KEY}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  if (
    !data.results ||
    !Array.isArray(data.results) ||
    data.results.length === 0
  ) {
    return NextResponse.json({ error: "No movies found" }, { status: 404 });
  }

  // Filter out movies with no backdrop_path (no image)
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

  const filtered = data.results.filter((movie: HeroMovie) => {
    return !!movie.backdrop_path;
  });

  // Pick 10 random movies from the filtered list (no duplicates)
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  let selected = shuffled.slice(0, 10);

  // If not enough movies, fill with fallback
  const fallbackImage = "/images/sinners.webp"; // You can change this to any local image
  if (selected.length < 10) {
    const missing = 10 - selected.length;
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
        : fallbackImage,
      year: movie.release_date ? movie.release_date.split("-")[0] : null,
      rating: movie.vote_average,
      votes: movie.vote_count,
      language: movie.original_language,
      description: movie.overview,
    }))
    .filter((m: HeroMovie) => m.id && m.title);

  // Cache in Redis (Upstash: set then expire)
  await redis.set(HERO_CACHE_KEY, JSON.stringify(heroes));
  await redis.expire(HERO_CACHE_KEY, HERO_CACHE_TTL);

  return NextResponse.json(heroes);
}
