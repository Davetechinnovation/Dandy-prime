import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CACHE_TTL = 60 * 60 * 2; // 2 hours

// --- TypeScript Types ---
interface Genre {
  id: number;
  name: string;
}
interface Keyword {
  id: number;
  name: string;
}
interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}
interface Cast {
  cast_id?: number;
  name: string;
  profile_path: string | null;
  character: string;
}
interface MovieDetails {
  id: number;
  title: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  runtime: number;
  original_language: string;
  genres: Genre[];
  adult: boolean;
  vote_count: number;
}
interface VideosResponse {
  id: number;
  results: Video[];
}
interface ReviewsResponse {
  id: number;
  page: number;
  results: unknown[];
  total_results: number;
  total_pages: number;
}
interface CreditsResponse {
  id: number;
  cast: Cast[];
  crew: unknown[];
}
interface RecommendationsResponse {
  page: number;
  results: MovieDetails[];
  total_pages: number;
  total_results: number;
}
interface SimilarResponse {
  page: number;
  results: MovieDetails[];
  total_pages: number;
  total_results: number;
}
interface KeywordsResponse {
  id: number;
  keywords: Keyword[];
}

interface FinalResponse {
  id: number;
  title: string;
  rating: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  runtime: number;
  language: string;
  genres: { id: number; name: string }[];
  keywords: { id: number; name: string }[];
  trailer: Video | null;
  reviews_count: number;
  main_cast: Cast[];
  recommendations: MovieDetails[];
  similar: MovieDetails[];
  adult: boolean;
  vote_count: number;
}

// --- Helper for TMDB fetch ---
async function fetchTMDB<T>(endpoint: string): Promise<T | null> {
  try {
    // Always append api_key param for v3 API
    const url = `${TMDB_BASE_URL}${endpoint}${
      endpoint.includes("?") ? "&" : "?"
    }api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`TMDB fetch failed: ${endpoint}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const movieId = req.nextUrl.searchParams.get("id");
  // Accept both mediaType and media_type for compatibility
  const mediaType =
    req.nextUrl.searchParams.get("mediaType") ||
    req.nextUrl.searchParams.get("media_type");
  if (!movieId || !mediaType) {
    return NextResponse.json(
      { error: "Missing movie id or mediaType" },
      { status: 400 }
    );
  }

  const cacheKey = `${mediaType}:details:${movieId}`;
  // Try Redis cache first
  const cached = await redis.get(cacheKey);
  if (typeof cached === "string" && cached) {
    try {
      // Serve cached data immediately
      const parsed = JSON.parse(cached);
      // Stale-while-revalidate: trigger background refresh
      (async () => {
        const now = Date.now();
        const cacheAge = parsed._cachedAt
          ? (now - parsed._cachedAt) / 1000
          : CACHE_TTL + 1;
        if (cacheAge > CACHE_TTL) {
          // Cache is stale, refresh in background
          await refreshAndCache();
        }
      })();
      // Remove _cachedAt before sending to client
      delete parsed._cachedAt;
      return NextResponse.json(parsed);
    } catch (e) {
      // ignore parse error, continue to fetch
      console.error("Redis cache parse error:", e);
    }
  }

  // Fetch primary details first
  const detailsEndpoint = `/${mediaType}/${movieId}?language=en-US`;
  const detailsRes = await fetchTMDB<MovieDetails>(detailsEndpoint);

  if (!detailsRes) {
    // If primary details fetch fails, return a specific error
    return NextResponse.json(
      { error: `Failed to fetch primary details for ${mediaType}/${movieId}` },
      { status: 500 }
    );
  }

  // Fetch other data concurrently
  const otherEndpoints = [
    `/${mediaType}/${movieId}/videos?language=en-US`,
    `/${mediaType}/${movieId}/reviews?language=en-US`,
    `/${mediaType}/${movieId}/credits?language=en-US`,
    `/${mediaType}/${movieId}/recommendations?language=en-US`,
    `/${mediaType}/${movieId}/similar?language=en-US`,
    `/${mediaType}/${movieId}/keywords?language=en-US`,
  ];

  const results = await Promise.allSettled([
    fetchTMDB<VideosResponse>(otherEndpoints[0]),
    fetchTMDB<ReviewsResponse>(otherEndpoints[1]),
    fetchTMDB<CreditsResponse>(otherEndpoints[2]),
    fetchTMDB<RecommendationsResponse>(otherEndpoints[3]),
    fetchTMDB<SimilarResponse>(otherEndpoints[4]),
    fetchTMDB<KeywordsResponse>(otherEndpoints[5]),
  ]);

  const videosRes =
    results[0].status === "fulfilled"
      ? (results[0].value as VideosResponse)
      : null;
  const reviewsRes =
    results[1].status === "fulfilled"
      ? (results[1].value as ReviewsResponse)
      : null;
  const creditsRes =
    results[2].status === "fulfilled"
      ? (results[2].value as CreditsResponse)
      : null;
  const recommendationsRes =
    results[3].status === "fulfilled"
      ? (results[3].value as RecommendationsResponse)
      : null;
  const similarRes =
    results[4].status === "fulfilled"
      ? (results[4].value as SimilarResponse)
      : null;
  const keywordsRes =
    results[5].status === "fulfilled"
      ? (results[5].value as KeywordsResponse)
      : null;

  const details: MovieDetails = detailsRes;

  // Extract trailer (first YouTube trailer)
  const trailer =
    videosRes?.results?.find(
      (v: Video) => v.type === "Trailer" && v.site === "YouTube"
    ) || null;

  // Extract main cast (top 8)
  const mainCast: Cast[] =
    creditsRes?.cast?.slice(0, 8).map((c: Cast) => ({
      name: c.name,
      profile_path: c.profile_path,
      character: c.character,
    })) || [];

  // Extract genres, keywords, recommendations, similar
  const genres =
    details.genres?.map((g: Genre) => ({ id: g.id, name: g.name })) || [];
  const keywordsList =
    keywordsRes?.keywords?.map((k: Keyword) => ({ id: k.id, name: k.name })) ||
    [];
  const recommendationsList = recommendationsRes?.results?.slice(0, 8) || [];
  const similarList = similarRes?.results?.slice(0, 8) || [];

  const responseData: FinalResponse = {
    id: details.id,
    title: details.title,
    rating: Number(details.vote_average.toFixed(2)),
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    overview: details.overview,
    release_date: details.release_date,
    runtime: details.runtime,
    language: details.original_language,
    genres,
    keywords: keywordsList,
    trailer,
    reviews_count: reviewsRes?.total_results || 0,
    main_cast: mainCast,
    recommendations: recommendationsList,
    similar: similarList,
    adult: details.adult,
    vote_count: details.vote_count,
  };
  const cacheObj = { ...responseData, _cachedAt: Date.now() };
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cacheObj));
  return NextResponse.json(responseData);
}

// --- Helper to fetch all data, handle errors, and cache ---
// This function is no longer directly called by GET, but kept for potential future use or clarity.
// If it were to be used, its return type would need to be adjusted to handle NextResponse.
async function refreshAndCache(): Promise<FinalResponse | null> {
  // This function's logic is now integrated into the GET function.
  // If it were to be called, it would need to be refactored to return a more specific error or data structure.
  // For now, we can consider it deprecated in this context.
  console.warn(
    "refreshAndCache called directly, which is not the intended flow after refactor."
  );
  return null; // Placeholder return
}
