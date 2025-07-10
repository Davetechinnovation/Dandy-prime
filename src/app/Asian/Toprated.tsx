"use client";
import React from "react";
import useSWR from "swr";
import MovieCard from "../Components/MovieCard";

import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Toprated = () => {
  const { data, error, isLoading } = useSWR("/api/home/asian", fetcher);
  // Deduplicate movies by id
  const topRatedRaw: Movie[] = data?.topRated || [];
  const seen = new Set<number>();
  const topRated: Movie[] = topRatedRaw.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">Failed to load</div>;

  return (
    <div>
      <div className="text-white pb-10 lg:pb-0 -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Top Rated
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
          {topRated.length === 0 && (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No top rated movies found.
            </div>
          )}
          {topRated.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toprated;
