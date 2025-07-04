import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
console.log('TMDB_API_KEY:', TMDB_API_KEY);
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface Movie {
  id: number;
  title?: string;
  name?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  video?: boolean;
}

function mapMovie(movie: Movie) {
  return {
    id: movie.id,
    title: movie.title || movie.name || "",
    image: movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
      : null,
    year: movie.release_date
      ? movie.release_date.slice(0, 4)
      : movie.first_air_date
      ? movie.first_air_date.slice(0, 4)
      : null,
    rating:
      typeof movie.vote_average === 'number'
        ? movie.vote_average.toFixed(1)
        : null,
  };
}

export async function GET(req: Request) {
  // 1. Top Rated (cache 1 hour)
  const topRatedRaw = await redis.get("all:topRated");
  let topRated: Movie[];
  if (typeof topRatedRaw === 'string') {
    topRated = JSON.parse(topRatedRaw);
  } else {
    const topRatedRes = await fetch(
      `${TMDB_BASE_URL}/movie/top_rated?language=en-US&page=1&api_key=${TMDB_API_KEY}`
    );
    const topRatedData = await topRatedRes.json();
    topRated = Array.isArray(topRatedData.results)
      ? [...topRatedData.results]
      : [];
    topRated = topRated
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapMovie);
    await redis.set("all:topRated", JSON.stringify(topRated));
  }

  // 2. New Releases (cache 1 hour)
  const newReleasesRaw = await redis.get("all:newReleases");
  let newReleases: Movie[];
  if (typeof newReleasesRaw === 'string') {
    newReleases = JSON.parse(newReleasesRaw);
  } else {
    const newReleaseRes = await fetch(
      `${TMDB_BASE_URL}/discover/movie?language=en-US&page=1&api_key=${TMDB_API_KEY}`
    );
    const newReleaseData = await newReleaseRes.json();
    newReleases = Array.isArray(newReleaseData.results)
      ? [...newReleaseData.results]
      : [];
    const thisYear = new Date().getFullYear();
    newReleases = newReleases
      .filter((m: Movie) => {
        const y = m.release_date ? parseInt(m.release_date.slice(0, 4)) : 0;
        return y >= thisYear - 1;
      })
      .sort(() => 0.5 - Math.random())
      .slice(0, 12)
      .map(mapMovie);
    await redis.set("all:newReleases", JSON.stringify(newReleases));
  }

  // 3. Popular (infinite scroll, no cache)
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const pageNum = pageParam ? parseInt(pageParam) : 1;
  let popular: Movie[] = [];
  const popRes = await fetch(
    `${TMDB_BASE_URL}/movie/popular?language=en-US&page=${pageNum}&api_key=${TMDB_API_KEY}`
  );
  const popData = await popRes.json();
  if (Array.isArray(popData.results)) {
    popular = popData.results.map(mapMovie);
  }

  return NextResponse.json({
    topRated,
    newReleases,
    popular,
    page: pageNum,
    totalPages: popData.total_pages || 1000,
  });
}
