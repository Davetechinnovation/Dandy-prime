import redis from "@/lib/redis";
import { NextResponse } from "next/server";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface Movie {
  id: number;
  title?: string;
  name?: string;
  backdrop_path?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  video?: boolean;
}

function mapMovie(movie: Movie) {
  return {
    id: movie.id,
    title: movie.title || movie.name || "",
    image: movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : null,
    year: movie.release_date
      ? movie.release_date.slice(0, 4)
      : movie.first_air_date
      ? movie.first_air_date.slice(0, 4)
      : null,
    rating:
      typeof movie.vote_average === "number"
        ? movie.vote_average.toFixed(1)
        : null,
  };
}

async function fetchAndCache(
  cacheKey: string,
  fetchUrl: string,
  mapFunction: (data: unknown) => Movie[],
  expirySeconds: number
): Promise<Movie[]> {
  try {
    const cachedData = await redis.get(cacheKey);
    if (typeof cachedData === "string") {
      console.log(`Returning data from cache for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch data from ${fetchUrl}: ${res.status} ${res.statusText}`
      );
    }

    const data: unknown = await res.json();
    const mappedData = mapFunction(data);

    await redis.setex(cacheKey, expirySeconds, JSON.stringify(mappedData));
    console.log(`Storing data in cache for ${cacheKey}`);
    return mappedData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        `Error fetching or caching data for ${cacheKey}: ${error.message}`
      );
    } else {
      console.error(`Unknown error fetching or caching data for ${cacheKey}`);
    }
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const topRated = await fetchAndCache(
      "all:topRated",
      `${TMDB_BASE_URL}/movie/top_rated?language=en-US&page=1&api_key=${process.env.TMDB_API_KEY}`,
      (data: unknown) => {
        if (
          typeof data === "object" &&
          data !== null &&
          Array.isArray((data as { results?: Movie[] }).results)
        ) {
          return (data as { results: Movie[] }).results
            .sort(() => 0.5 - Math.random())
            .slice(0, 12)
            .map(mapMovie);
        }
        return [];
      },
      3600 // 1 hour
    );

    const newReleases = await fetchAndCache(
      "all:newReleases",
      `${TMDB_BASE_URL}/discover/movie?language=en-US&page=1&api_key=${process.env.TMDB_API_KEY}`,
      (data: unknown) => {
        if (
          typeof data === "object" &&
          data !== null &&
          Array.isArray((data as { results?: Movie[] }).results)
        ) {
          const thisYear = new Date().getFullYear();
          return (data as { results: Movie[] }).results
            .filter((m: Movie) => {
              const y = m.release_date
                ? parseInt(m.release_date.slice(0, 4))
                : 0;
              return y >= thisYear - 1;
            })
            .sort(() => 0.5 - Math.random())
            .slice(0, 12)
            .map(mapMovie);
        }
        return [];
      },
      3600 // 1 hour
    );

    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const pageNum = pageParam ? parseInt(pageParam) : 1;
    const popularCacheKey = `all:popular:page:${pageNum}`;

    const popularData = await fetchAndCache(
      popularCacheKey,
      `${TMDB_BASE_URL}/movie/popular?language=en-US&page=${pageNum}&api_key=${process.env.TMDB_API_KEY}`,
      (data: unknown) => {
        if (
          typeof data === "object" &&
          data !== null &&
          Array.isArray((data as { results?: Movie[] }).results)
        ) {
          return (data as { results: Movie[] }).results.map(mapMovie);
        }
        return [];
      },
      3600 // 1 hour
    );

    return NextResponse.json({
      topRated,
      newReleases,
      popular: popularData,
      page: pageNum,
      totalPages: 1000,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error in GET handler:", error.message);
    } else {
      console.error("Unknown error in GET handler");
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
