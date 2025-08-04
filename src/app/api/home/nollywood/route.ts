import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const NOLLYWOOD_COUNTRIES = [
  "NG", // Nigeria
  // Optionally add more West African countries if desired
];

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

const NOLLYWOOD_TOPRATED_CACHE_KEY = "nollywood:toprated";
const NOLLYWOOD_NEWRELEASE_CACHE_KEY = "nollywood:newreleases";

export async function GET(req: Request) {
  const fetchAndMergeContent = async (
    sortBy: string,
    filters: string,
    page: number = 1
  ) => {
    const allContent: ContentItem[] = [];
    for (const country of NOLLYWOOD_COUNTRIES) {
      // Fetch movies
      const movieRes = await fetch(
        `${TMDB_BASE_URL}/discover/movie?sort_by=${sortBy}&language=en-US&page=${page}&api_key=${TMDB_API_KEY}&with_origin_country=${country}${filters}&without_genres=99,10770`,
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
      // Fetch TV shows
      const tvRes = await fetch(
        `${TMDB_BASE_URL}/discover/tv?sort_by=${sortBy}&language=en-US&page=${page}&api_key=${TMDB_API_KEY}&with_origin_country=${country}${filters}&without_genres=99,10770`,
        { headers: { "Content-Type": "application/json" } }
      );
      const tvData = await tvRes.json();
      if (Array.isArray(tvData.results)) {
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
    return allContent.filter((m) => {
      // Use both id and media_type for uniqueness, but also fallback to id if media_type is missing
      const key = m.media_type ? `${m.id}-${m.media_type}` : `${m.id}`;
      if (seen.has(key) || !m.backdrop_path) return false;
      seen.add(key);
      return true;
    });
  };

  // 1. Top Rated Nollywood Content (Movies & TV) - 12 random, cache 1 hour (LOOSENED)
  let topRated: ReturnType<typeof mapContent>[] = [];
  const cachedTopRated = await redis.get(NOLLYWOOD_TOPRATED_CACHE_KEY);
  if (typeof cachedTopRated === "string") {
    try {
      topRated = JSON.parse(cachedTopRated);
    } catch {
      topRated = [];
    }
  }
  if (!topRated || topRated.length === 0) {
    // Loosen: allow any year, very low vote count
    const allTopRated = await fetchAndMergeContent(
      "vote_average.desc",
      `&vote_count.gte=3` // No year filter, very low vote count
    );
    topRated = allTopRated
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapContent);
    await redis.set(NOLLYWOOD_TOPRATED_CACHE_KEY, JSON.stringify(topRated));
  }

  // 2. New Released Nollywood Content (Movies & TV) - 12 random, from last 10 years, cache 1 hour (LOOSENED)
  let newReleases: ReturnType<typeof mapContent>[] = [];
  const cachedNewReleases = await redis.get(NOLLYWOOD_NEWRELEASE_CACHE_KEY);
  if (typeof cachedNewReleases === "string") {
    try {
      newReleases = JSON.parse(cachedNewReleases);
    } catch {
      newReleases = [];
    }
  }
  if (!newReleases || newReleases.length === 0) {
    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    const allNewReleases = await fetchAndMergeContent(
      "primary_release_date.desc",
      `&primary_release_date.gte=${lastYear}-01-01&primary_release_date.lte=${thisYear}-12-31&vote_count.gte=2` // Only this year and last year, very low vote count
    );
    newReleases = allNewReleases
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapContent);
    await redis.set(
      NOLLYWOOD_NEWRELEASE_CACHE_KEY,
      JSON.stringify(newReleases)
    );
  }

  // 3. Popular Nollywood Content (Movies & TV) - infinite scroll, cache per page for 1 hour (LOOSENED)
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const pageNum = pageParam ? parseInt(pageParam) : 1;
  const popularCacheKey = `nollywood:popular:page:${pageNum}`;
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
      `&vote_count.gte=2`, // Loosened: very low vote count
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
