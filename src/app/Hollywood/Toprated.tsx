"use client";
import React, { useEffect, useState } from "react";
import MovieCard from "../Components/MovieCard";

import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

const Toprated = () => {
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopRated() {
      setLoading(true);
      try {
        const res = await fetch("/api/home/hollywood");
        const data = await res.json();
        setTopRated(data.topRated || []);
      } catch {
        setTopRated([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTopRated();
  }, []);

  return (
    <div>
      <div className="text-white pb-10 lg:pb-0 -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Top Rated
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
          {loading ? (
            <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
              <Loader />
            </div>
          ) : topRated.length === 0 ? (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No top rated movies found.
            </div>
          ) : (
            topRated.map((movie) => <MovieCard key={movie.id} movie={movie} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Toprated;
