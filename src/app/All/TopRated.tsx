import React from "react";
import { useQuery } from "@tanstack/react-query";
import MovieCard from "../Components/MovieCard";

import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

const TopRated = () => {
  // React Query for top rated
  const { data, isLoading } = useQuery({
    queryKey: ["allTopRated"],
    queryFn: async () => {
      const res = await fetch("/api/home/all");
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
  const topRated: Movie[] = data?.topRated || [];
  const loading = isLoading;

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Top Rated Movies
        </h2>
        {loading ? (
          <Loader />
        ) : (
          <div className="px-2 grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-[15px] ">
            {topRated.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopRated;
