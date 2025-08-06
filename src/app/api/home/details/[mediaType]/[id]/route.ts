// --- Helper to fetch all data, handle errors, and cache ---
async function refreshAndCache(): Promise<void> {
  try {
    // Placeholder for background cache refresh logic
    // You can implement this if you want to refresh cache in the background
    console.warn(
      "refreshAndCache called directly, which is not the intended flow after refactor."
    );
  } catch (error) {
    console.error("Error in refreshAndCache:", error);
  }
}
// Helper for Promise.allSettled type guard
function isPromiseFulfilled<T>(
  result: PromiseSettledResult<T | null>
): result is PromiseFulfilledResult<T | null> {
  return result.status === "fulfilled";
}
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
  title?: string;
  name?: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
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
  name?: string;
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


  export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mediaType: string; id: string }> }
) {
  const { id: movieId, mediaType } = await context.params;

  if (!movieId || !mediaType) {
    return NextResponse.json(
      { error: "Missing movie id or mediaType" },
      { status: 400 }
    );
  }

  const cacheKey = `${mediaType}:details:${movieId}`;
  // Try Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached && typeof cached === "string") {
    try {
      const parsed = JSON.parse(cached as string) as FinalResponse & {
        _cachedAt?: number;
      };
      // Stale-while-revalidate: trigger background refresh
      const now = Date.now();
      const cacheAge = parsed._cachedAt
        ? (now - parsed._cachedAt) / 1000
        : CACHE_TTL + 1;
      if (cacheAge > CACHE_TTL) {
        // Cache is stale, refresh in background
        void refreshAndCache();
      }
      // Remove _cachedAt before sending to client
      const responseData = { ...parsed };
      delete responseData._cachedAt;
      return NextResponse.json(responseData);
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

  const videosRes = isPromiseFulfilled<VideosResponse>(results[0])
    ? results[0].value
    : null;
  const reviewsRes = isPromiseFulfilled<ReviewsResponse>(results[1])
    ? results[1].value
    : null;
  const creditsRes = isPromiseFulfilled<CreditsResponse>(results[2])
    ? results[2].value
    : null;
  const recommendationsRes = isPromiseFulfilled<RecommendationsResponse>(
    results[3]
  )
    ? results[3].value
    : null;
  const similarRes = isPromiseFulfilled<SimilarResponse>(results[4])
    ? results[4].value
    : null;
  const keywordsRes = isPromiseFulfilled<KeywordsResponse>(results[5])
    ? results[5].value
    : null;

  // Make sure details is defined
  const details = detailsRes;
  if (!details) {
    return NextResponse.json(
      { error: "Failed to fetch details" },
      { status: 500 }
    );
  }

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
    title: details.title || details.name || "",
    rating: Number(details.vote_average.toFixed(2)),
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    overview: details.overview,
    release_date: details.release_date || details.first_air_date || "",
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
