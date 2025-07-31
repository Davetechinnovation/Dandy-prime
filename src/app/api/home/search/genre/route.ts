import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(req: NextRequest) {
  const genreId = req.nextUrl.searchParams.get('id');
  const page = req.nextUrl.searchParams.get('page') || '1';
  if (!genreId) {
    return NextResponse.json({ error: 'Missing genre id' }, { status: 400 });
  }
  try {
    const url = `${TMDB_BASE_URL}/discover/movie?with_genres=${genreId}&page=${page}&api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch movies by genre');
    const json = await res.json();
    // Map TMDB results to your Movie type
    const results = (json.results || []).map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      year: movie.release_date ? movie.release_date.slice(0, 4) : null,
      rating: movie.vote_average,
    }));
    return NextResponse.json({
      results,
      totalResults: json.total_results,
      totalPages: json.total_pages,
      page: json.page,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch movies by genre' }, { status: 500 });
  }
}
