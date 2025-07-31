"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import MovieCard from "../Components/MovieCard";
import TopRated from "./TopRated";
import Popular from "./Popular";
import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

const Page = () => {
  // React Query for new releases
  const { data, isLoading } = useQuery({
    queryKey: ["allNewReleases"],
    queryFn: async () => {
      const res = await fetch("/api/home/all");
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
  const newReleases: Movie[] = data?.newReleases || [];
  const loading = isLoading;

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4  ">
          New Released Movies
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
          {loading ? (
            <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
              <Loader />
            </div>
          ) : newReleases.length === 0 ? (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No new releases found.
            </div>
          ) : (
            newReleases.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          )}
        </div>
      </div>
      <TopRated />
      <Popular />
    </div>
  );
};

export default Page;
