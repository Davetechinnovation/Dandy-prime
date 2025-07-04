import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const HOLLYWOOD_COUNTRIES = [
  "US", // United States
  "GB", // United Kingdom
  "CA", // Canada
  "AU", // Australia
  "NZ", // New Zealand
  "IE", // Ireland
];

// General map function for both movies and TV shows
interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  backdrop_path?: string;
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
    image: item.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
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
    media_type: item.media_type || (item.title ? "movie" : "tv"),
    video: item.video,
  };
}

const HOLLYWOOD_TOPRATED_CACHE_KEY = "hollywood:toprated";
const HOLLYWOOD_NEWRELEASE_CACHE_KEY = "hollywood:newreleases";

export async function GET(req: Request) {
  // Helper function to fetch and merge results for both movies and TV shows
  const fetchAndMergeContent = async (
    sortBy: string,
    filters: string,
    page: number = 1
  ) => {
    const allContent: ContentItem[] = [];
    for (const country of HOLLYWOOD_COUNTRIES) {
      // Fetch movies only (no TV shows for Hollywood)
      const movieRes = await fetch(
        `${TMDB_BASE_URL}/discover/movie?sort_by=${sortBy}&language=en-US&page=${page}&api_key=${TMDB_API_KEY}&with_origin_country=${country}${filters}`,
        { headers: { "Content-Type": "application/json" } }
      );
      const movieData = await movieRes.json();
      if (Array.isArray(movieData.results)) {
        allContent.push(
          ...movieData.results.map((item: ContentItem) => ({
            ...item,
            media_type: "movie",
          }))
        );
      }
    }
    // Deduplicate by id and filter out items with no image
    const seen = new Set<number>();
    return allContent.filter((m) => {
      if (seen.has(m.id) || !m.backdrop_path) return false;
      seen.add(m.id);
      return true;
    });
  };

  // 1. Top Rated Hollywood Content (Movies) - 12 random, cache 1 hour
  let topRated: ReturnType<typeof mapContent>[] = [];
  const cachedTopRated = await redis.get(HOLLYWOOD_TOPRATED_CACHE_KEY);
  if (typeof cachedTopRated === "string") {
    try {
      topRated = JSON.parse(cachedTopRated);
    } catch {
      topRated = [];
    }
  }
  if (!topRated || topRated.length === 0) {
    const minYear = 2000;
    const allTopRated = await fetchAndMergeContent(
      "vote_average.desc",
      `&vote_count.gte=1000&primary_release_date.gte=${minYear}-01-01&without_genres=99,10770`
    );
    topRated = allTopRated
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapContent);
    await redis.set(HOLLYWOOD_TOPRATED_CACHE_KEY, JSON.stringify(topRated));
  }

  // 2. New Released Hollywood Content (Movies) - 12 random, from last 2 years, cache 1 hour
  let newReleases: ReturnType<typeof mapContent>[] = [];
  const cachedNewReleases = await redis.get(HOLLYWOOD_NEWRELEASE_CACHE_KEY);
  if (typeof cachedNewReleases === "string") {
    try {
      newReleases = JSON.parse(cachedNewReleases);
    } catch {
      newReleases = [];
    }
  }
  if (!newReleases || newReleases.length === 0) {
    const thisYear = new Date().getFullYear();
    const twoYearsAgo = thisYear - 2;
    const allNewReleases = await fetchAndMergeContent(
      "primary_release_date.desc",
      `&primary_release_date.gte=${twoYearsAgo}-01-01&primary_release_date.lte=${thisYear}-12-31&vote_count.gte=100&without_genres=99,10770`
    );
    newReleases = allNewReleases
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapContent);
    await redis.set(
      HOLLYWOOD_NEWRELEASE_CACHE_KEY,
      JSON.stringify(newReleases)
    );
  }

  // 3. Popular Hollywood Content (Movies) - infinite scroll, cache per page for 1 hour
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const pageNum = pageParam ? parseInt(pageParam) : 1;
  const popularCacheKey = `hollywood:popular:page:${pageNum}`;
  const popularRaw = await redis.get(popularCacheKey);
  let popular: ReturnType<typeof mapContent>[] = [];
  if (typeof popularRaw === "string") {
    try {
      popular = JSON.parse(popularRaw);
    } catch {
      popular = [];
    }
  }
  if (!popular || popular.length === 0) {
    const allPopular = await fetchAndMergeContent(
      "popularity.desc",
      `&vote_count.gte=1000&without_genres=99,10770`,
      pageNum
    );
    popular = allPopular.map(mapContent);
    await redis.set(popularCacheKey, JSON.stringify(popular));
  }

  return NextResponse.json({
    topRated,
    newReleases,
    popular,
    page: pageNum,
    totalPages: 1000,
  });
}
