import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const BOLLYWOOD_COUNTRIES = ["IN", "PK"];

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

const BOLLYWOOD_TOPRATED_CACHE_KEY = "bollywood:toprated";
const BOLLYWOOD_NEWRELEASE_CACHE_KEY = "bollywood:newreleases";

export async function GET(req: Request) {
  const fetchAndMergeContent = async (
    sortBy: string,
    filters: string,
    pageRange: number[] = [1]
  ) => {
    const allContent: ContentItem[] = [];

    for (const page of pageRange) {
      // Fetch all countries in parallel for this page
      const countryPromises = BOLLYWOOD_COUNTRIES.map(async (country) => {
        // Fetch movies and TV in parallel for this country
        const [movieRes, tvRes] = await Promise.all([
          fetch(
            `${TMDB_BASE_URL}/discover/movie?sort_by=${sortBy}&language=en-US&page=${page}&api_key=${TMDB_API_KEY}&with_origin_country=${country}${filters}&without_genres=99,10770`
          ),
          fetch(
            `${TMDB_BASE_URL}/discover/tv?sort_by=${sortBy}&language=en-US&page=${page}&api_key=${TMDB_API_KEY}&with_origin_country=${country}${filters}&without_genres=99,10770`
          ),
        ]);
        const movieData = await movieRes.json();
        const tvData = await tvRes.json();
        const movieResults = Array.isArray(movieData.results)
          ? movieData.results.map((item: ContentItem) => ({
              ...item,
              media_type: "movie",
            }))
          : [];
        const tvResults = Array.isArray(tvData.results)
          ? tvData.results.map((item: ContentItem) => ({
              ...item,
              media_type: "tv",
            }))
          : [];
        return [...movieResults, ...tvResults];
      });
      // Wait for all countries for this page
      const results = await Promise.all(countryPromises);
      results.forEach((arr) => allContent.push(...arr));
    }

    const seen = new Set<number>();
    return allContent.filter((m) => {
      if (seen.has(m.id) || !m.backdrop_path) return false;
      seen.add(m.id);
      return true;
    });
  };

  // Loosen filters: only require country and a low vote count, drop language filter
  const voteFilter = `&vote_count.gte=10`;
  const filters = `${voteFilter}`;
  const pageRange = [1, 2, 3, 4, 5];

  // Top Rated
  let topRated: ReturnType<typeof mapContent>[] = [];
  const cachedTopRated = await redis.get(BOLLYWOOD_TOPRATED_CACHE_KEY);
  if (typeof cachedTopRated === "string") {
    try {
      topRated = JSON.parse(cachedTopRated);
    } catch {
      topRated = [];
    }
  }
  if (!topRated.length) {
    const allTopRated = await fetchAndMergeContent(
      "vote_average.desc",
      filters,
      pageRange
    );
    topRated = allTopRated
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapContent);
    await redis.set(BOLLYWOOD_TOPRATED_CACHE_KEY, JSON.stringify(topRated));
  }

  // New Releases
  let newReleases: ReturnType<typeof mapContent>[] = [];
  const cachedNewReleases = await redis.get(BOLLYWOOD_NEWRELEASE_CACHE_KEY);
  if (typeof cachedNewReleases === "string") {
    try {
      newReleases = JSON.parse(cachedNewReleases);
    } catch {
      newReleases = [];
    }
  }
  if (!newReleases.length) {
    const thisYear = new Date().getFullYear();
    const twoYearsAgo = thisYear - 2;
    const dateFilter = `&primary_release_date.gte=${twoYearsAgo}-01-01&primary_release_date.lte=${thisYear}-12-31`;
    const allNewReleases = await fetchAndMergeContent(
      "primary_release_date.desc",
      `${filters}${dateFilter}`,
      pageRange
    );
    newReleases = allNewReleases
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapContent);
    await redis.set(
      BOLLYWOOD_NEWRELEASE_CACHE_KEY,
      JSON.stringify(newReleases)
    );
  }

  // Popular
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const pageNum = pageParam ? parseInt(pageParam) : 1;
  const popularCacheKey = `bollywood:popular:page:${pageNum}`;
  let popular: ReturnType<typeof mapContent>[] = [];
  const popularRaw = await redis.get(popularCacheKey);
  if (typeof popularRaw === "string") {
    try {
      popular = JSON.parse(popularRaw);
    } catch {
      popular = [];
    }
  }
  if (!popular.length) {
    const allPopular = await fetchAndMergeContent("popularity.desc", filters, [
      pageNum,
    ]);
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
