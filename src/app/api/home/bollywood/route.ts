import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const BOLLYWOOD_COUNTRIES = ["IN", "PK"];
// Removed EMPTY_ARRAY, use [] as T[] directly for type safety
const DEFAULT_TOTAL_PAGES = 1000;
const CACHE_TTL = 60 * 60; // 1 hour
const ERROR_TTL = 5 * 60; // 5 minutes
const BOLLYWOOD_TOP_RATED_CACHE_KEY = "bollywood:topRated";
const BOLLYWOOD_NEW_RELEASES_CACHE_KEY = "bollywood:newReleases";

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

interface FetchAndMergeOptions<T> {
  cacheKey: string;
  sortBy: string;
  filters: string;
  page?: number;
  mapFn: (item: ContentItem) => T;
  cacheTTL?: number;
  errorTTL?: number;
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
  const cached = await redis.get(cacheKey);
  if (typeof cached === "string" && cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  try {
    const allContent: ContentItem[] = [];
    // Fetch both movies and TV shows for each country
    for (const country of BOLLYWOOD_COUNTRIES) {
      // Fetch movies
      const movieUrl = buildTmdbUrl("/discover/movie", {
        sort_by: sortBy,
        language: "en-US",
        page,
        with_origin_country: country,
      });
      const fullMovieUrl = movieUrl + filters;
      
      // Fetch TV shows
      const tvUrl = buildTmdbUrl("/discover/tv", {
        sort_by: sortBy,
        language: "en-US",
        page,
        with_origin_country: country,
      });
      const fullTvUrl = tvUrl + filters;

      try {
        // Fetch movies
        const movieRes = await fetch(fullMovieUrl, {
          headers: { "Content-Type": "application/json" },
        });
        const movieData = await movieRes.json();
        
        if (Array.isArray(movieData?.results)) {
          allContent.push(
            ...movieData.results.map((item: ContentItem) => ({
              ...item,
              media_type: "movie",
            }))
          );
        }

        // Fetch TV shows
        const tvRes = await fetch(fullTvUrl, {
          headers: { "Content-Type": "application/json" },
        });
        const tvData = await tvRes.json();
        
        if (Array.isArray(tvData?.results)) {
          allContent.push(
            ...tvData.results.map((item: ContentItem) => ({
              ...item,
              media_type: "tv",
            }))
          );
        }
      } catch (error) {
        console.error(`TMDB fetch error for ${country}:`, error);
        throw error;
      }
    }

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
    await redis.setex(cacheKey, errorTTL, JSON.stringify([]));
    return [] as T[];
  }
}

export async function GET(req: Request) {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const pageNum = pageParam ? parseInt(pageParam) : 1;

    const thisYear = new Date().getFullYear();
    const twoYearsAgo = thisYear - 2;

    const topRated = (
      await fetchAndMergeContent({
        cacheKey: BOLLYWOOD_TOP_RATED_CACHE_KEY,
        sortBy: "vote_average.desc",
        filters: `&vote_count.gte=500&primary_release_date.gte=2000-01-01&without_genres=99,10770`,
        mapFn: mapContent,
      })
    )
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);

    const newReleases = (
      await fetchAndMergeContent({
        cacheKey: BOLLYWOOD_NEW_RELEASES_CACHE_KEY,
        sortBy: "primary_release_date.desc",
        filters: `&primary_release_date.gte=${twoYearsAgo}-01-01&primary_release_date.lte=${thisYear}-12-31&vote_count.gte=100&without_genres=99,10770`,
        mapFn: mapContent,
      })
    )
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);

    const popular = await fetchAndMergeContent({
      cacheKey: `bollywood:popular:page:${pageNum}`,
      sortBy: "popularity.desc",
      filters: `&vote_count.gte=100&without_genres=99,10770`,
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
    console.error("Error in Bollywood GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
