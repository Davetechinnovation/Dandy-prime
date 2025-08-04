"use client";
import React, { useEffect, useState } from "react";
import MovieCard from "../Components/MovieCard";

import Toprated from "./Toprated";
import Popular from "./Popular";
import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
  media_type?: string;
};

const Page = () => {
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNewReleases() {
      setLoading(true);
      try {
        const res = await fetch("/api/home/nollywood");
        const data = await res.json();
        setNewReleases(data.newReleases || []);
      } catch {
        setNewReleases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNewReleases();
  }, []);

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          New Released Nollywood
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
              <MovieCard
                key={movie.id}
                movie={{
                  ...movie,
                  media_type: movie.media_type === "tv" ? "tv" : "movie",
                }}
              />
            ))
          )}
        </div>
      </div>
      <Toprated />
      <Popular />
    </div>
  );
};

export default Page;
