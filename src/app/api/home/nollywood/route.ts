const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const NOLLYWOOD_COUNTRIES = ["NG"];
// Removed EMPTY_ARRAY, use [] as T[] directly for type safety
const DEFAULT_TOTAL_PAGES = 1000;
const CACHE_TTL = 60 * 60; // 1 hour
const ERROR_TTL = 5 * 60; // 5 minutes

const NOLLYWOOD_TOPRATED_CACHE_KEY = "nollywood:topRated";
const NOLLYWOOD_NEWRELEASE_CACHE_KEY = "nollywood:newReleases";

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
    } catch (err) {
      console.error(`Error parsing cached data ${cacheKey}:`, err);
      // If cache is corrupted, ignore and fetch fresh
    }
  }
  try {
    const allContent: ContentItem[] = [];
    for (const country of NOLLYWOOD_COUNTRIES) {
      // Fetch movies
      let movieRes, movieData;
      try {
        const movieUrl =
          buildTmdbUrl("/discover/movie", {
            sort_by: sortBy,
            language: "en-US",
            page,
            with_origin_country: country,
          }) +
          filters +
          "&without_genres=99,10770";

        movieRes = await fetch(movieUrl, {
          headers: { "Content-Type": "application/json" },
        });

        if (!movieRes.ok) {
          console.error(
            `TMDB API error (movie) for country ${country}: ${movieRes.status} ${movieRes.statusText}`
          );
          throw new Error(`TMDB API error: ${movieRes.status}`);
        }

        movieData = await movieRes.json();
      } catch (err) {
        console.error(`TMDB fetch error (movie) for country ${country}:`, err);
        throw err;
      }
      if (Array.isArray(movieData?.results)) {
        allContent.push(
          ...movieData.results.map((item: ContentItem) => ({
            ...item,
            media_type: "movie",
          }))
        );
      }
      // Fetch TV shows
      let tvRes, tvData;
      try {
        const tvUrl =
          buildTmdbUrl("/discover/tv", {
            sort_by: sortBy,
            language: "en-US",
            page,
            with_origin_country: country,
          }) +
          filters +
          "&without_genres=99,10770";

        tvRes = await fetch(tvUrl, {
          headers: { "Content-Type": "application/json" },
        });

        if (!tvRes.ok) {
          console.error(
            `TMDB API error (tv) for country ${country}: ${tvRes.status} ${tvRes.statusText}`
          );
          throw new Error(`TMDB API error: ${tvRes.status}`);
        }

        tvData = await tvRes.json();
      } catch (err) {
        console.error(`TMDB fetch error (tv) for country ${country}:`, err);
        throw err;
      }
      if (Array.isArray(tvData?.results)) {
        allContent.push(
          ...tvData.results.map((item: ContentItem) => ({
            ...item,
            media_type: "tv",
          }))
        );
      }
    }
    // Deduplicate by id+media_type and filter out items with no image
    const seen = new Set<string>();
    const deduped = allContent.filter((m) => {
      const key = m.media_type ? `${m.id}-${m.media_type}` : `${m.id}`;
      if (seen.has(key) || !m.poster_path) return false;
      seen.add(key);
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
  try {
    // 1. Top Rated Nollywood Content (Movies & TV) - 12 random, cache 1 hour (LOOSENED)
    const topRated = (
      await fetchAndMergeContent({
        cacheKey: NOLLYWOOD_TOPRATED_CACHE_KEY,
        sortBy: "vote_average.desc",
        filters: `&vote_count.gte=3`,
        mapFn: mapContent,
      })
    )
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);

    // 2. New Released Nollywood Content (Movies & TV) - 12 random, from last 2 years, cache 1 hour (LOOSENED)
    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    const newReleases = (
      await fetchAndMergeContent({
        cacheKey: NOLLYWOOD_NEWRELEASE_CACHE_KEY,
        sortBy: "primary_release_date.desc",
        filters: `&primary_release_date.gte=${lastYear}-01-01&primary_release_date.lte=${thisYear}-12-31&vote_count.gte=2`,
        mapFn: mapContent,
      })
    )
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);

    // 3. Popular Nollywood Content (Movies & TV) - infinite scroll, cache per page for 1 hour (LOOSENED)
    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const pageNum = pageParam ? parseInt(pageParam) : 1;
    const popularCacheKey = `nollywood:popular:page:${pageNum}`;
    const popular = await fetchAndMergeContent({
      cacheKey: popularCacheKey,
      sortBy: "popularity.desc",
      filters: `&vote_count.gte=2`,
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
    console.error("Error in Nollywood GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import redis from "@/lib/redis";
