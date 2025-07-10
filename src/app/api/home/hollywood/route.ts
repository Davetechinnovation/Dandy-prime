import { NextResponse } from "next/server";
import redis from "@/lib/redis";
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Constants
const HOLLYWOOD_COUNTRIES = ["US", "GB", "CA", "AU", "NZ", "IE"];
// Removed EMPTY_ARRAY, use [] as T[] directly for type safety
const DEFAULT_TOTAL_PAGES = 1000;
const CACHE_TTL = 60 * 60; // 1 hour
const ERROR_TTL = 5 * 60; // 5 minutes

// Cache Keys
const HOLLYWOOD_TOP_RATED_CACHE_KEY = "hollywood:topRated";
const HOLLYWOOD_NEW_RELEASES_CACHE_KEY = "hollywood:newReleases";

interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  backdrop_path?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: string;
  video?: boolean;
}

function mapContent(item: ContentItem) {
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
    rating:
      typeof item.vote_average === "number"
        ? item.vote_average.toFixed(1)
        : null,
    mediaType: item.media_type || (item.title ? "movie" : "tv"),
    video: item.video,
  };
}

interface FetchAndMergeOptions<T> {
  cacheKey: string;
  sortBy: string;
  filters: string;
  page?: number;
  mapFn: (item: ContentItem) => T;
  cacheTTL?: number;
  errorTTL?: number;
}

// Build TMDB API URL
function buildTmdbUrl(
  endpoint: string,
  params: Record<string, string | number> = {}
) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY || "");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function fetchAndMergeContent<T>({
  cacheKey,
  sortBy,
  filters,
  page = 1,
  mapFn,
  cacheTTL = CACHE_TTL,
  errorTTL = ERROR_TTL,
}: FetchAndMergeOptions<T>): Promise<T[]> {
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (typeof cached === "string" && cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // If cache is corrupted, ignore and fetch fresh
    }
  }
  try {
    const allContent: ContentItem[] = [];
    for (const country of HOLLYWOOD_COUNTRIES) {
      const url = buildTmdbUrl("/discover/movie", {
        sort_by: sortBy,
        language: "en-US",
        page,
        with_origin_country: country,
      });
      const fullUrl = url + filters;
      let movieRes, movieData;
      try {
        movieRes = await fetch(fullUrl, {
          headers: { "Content-Type": "application/json" },
        });
        movieData = await movieRes.json();
      } catch (error) {
        console.error(`TMDB fetch error for country ${country}:`, error);
        throw error;
      }
      if (Array.isArray(movieData?.results)) {
        allContent.push(
          ...movieData.results.map((item: ContentItem) => ({
            ...item,
            media_type: "movie",
          }))
        );
      }
    }
    // Deduplicate by id and filter out items with no poster
    const seen = new Set<number>();
    const deduped = allContent.filter((m) => {
      if (seen.has(m.id) || !m.poster_path) return false;
      seen.add(m.id);
      return true;
    });
    const mapped = deduped.map(mapFn);
    await redis.setex(cacheKey, cacheTTL, JSON.stringify(mapped));
    return mapped;
  } catch (error) {
    console.error("Error in fetchAndMergeContent:", error);
    // Cache empty array for short time to avoid hammering TMDB
    await redis.setex(cacheKey, errorTTL, JSON.stringify([]));
    return [] as T[];
  }
}

export async function GET(req: Request) {
  try {
    // 1. Top Rated Hollywood Content (Movies) - 12 random, cache 1 hour
    const minYear = 2000;
    const topRated = (
      await fetchAndMergeContent({
        cacheKey: HOLLYWOOD_TOP_RATED_CACHE_KEY,
        sortBy: "vote_average.desc",
        filters: `&vote_count.gte=1000&primary_release_date.gte=${minYear}-01-01&without_genres=99,10770`,
        mapFn: mapContent,
      })
    )
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);

    // 2. New Released Hollywood Content (Movies) - 12 random, from last 2 years, cache 1 hour
    const thisYear = new Date().getFullYear();
    const twoYearsAgo = thisYear - 2;
    const newReleases = (
      await fetchAndMergeContent({
        cacheKey: HOLLYWOOD_NEW_RELEASES_CACHE_KEY,
        sortBy: "primary_release_date.desc",
        filters: `&primary_release_date.gte=${twoYearsAgo}-01-01&primary_release_date.lte=${thisYear}-12-31&vote_count.gte=100&without_genres=99,10770`,
        mapFn: mapContent,
      })
    )
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);

    // 3. Popular Hollywood Content (Movies) - infinite scroll, cache per page for 1 hour
    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const pageNum = pageParam ? parseInt(pageParam) : 1;
    const popularCacheKey = `hollywood:popular:page:${pageNum}`;
    const popular = await fetchAndMergeContent({
      cacheKey: popularCacheKey,
      sortBy: "popularity.desc",
      filters: `&vote_count.gte=1000&without_genres=99,10770`,
      page: pageNum,
      mapFn: mapContent,
    });

    return NextResponse.json({
      topRated,
      newReleases,
      popular,
      page: pageNum,
      totalPages: DEFAULT_TOTAL_PAGES,
    });
  } catch (error) {
    console.error("Error in Hollywood GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
