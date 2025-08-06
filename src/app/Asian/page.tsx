"use client";
import React from "react";
import useSWR from "swr";
import MovieCard from "../Components/MovieCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
import Loader from "../Components/Loader";
import Toprated from "./Toprated";
import Popular from "./Popular";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
  media_type: "movie" | "tv";
  video?: boolean;
};
const Asian: React.FC = () => {
  return (
    <>
      <div className="text-white -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          New Released Asian Drama
        </h2>
        <NewReleasesSection />
      </div>
      <Toprated />
      <Popular />
    </>
  );
};

// NewReleasesSection fetches and displays new releases with its own loader
const NewReleasesSection = () => {
  const { data, error, isLoading } = useSWR("/api/home/asian", fetcher);
  const newReleases: Movie[] = data?.newReleases || [];

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">Failed to load</div>;

  return (
    <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
      {newReleases.length === 0 ? (
        <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
          No new releases found.
        </div>
      ) : (
        newReleases.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={{
              ...movie,
              rating: Number(movie.rating || 0),
            }}
          />
        ))
      )}
    </div>
  );
};

export default Asian;
