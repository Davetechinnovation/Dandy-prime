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

const Popular = () => {
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch movies for a given page
  const fetchPopular = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/home/bollywood?page=${pageNum}`);
      const data = await res.json();
      const newMovies = data.popular || [];
      setPopular((prev) =>
        pageNum === 1 ? newMovies : [...prev, ...newMovies]
      );
      setHasMore(newMovies.length > 0);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPopular(1);
    setPage(1);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPopular(page + 1);
          setPage((p) => p + 1);
        }
      },
      { threshold: 1 }
    );
    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasMore, loading, page]);

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-[4px] ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px] ">
          {popular.length === 0 && !loading ? (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No popular movies found.
            </div>
          ) : (
            popular.map((movie) => <MovieCard key={movie.id} movie={movie} />)
          )}
        </div>
        <div ref={loaderRef} />
        {loading && (
          <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
            <Loader />
          </div>
        )}
        {!hasMore && !loading && popular.length > 0 && (
          <div className="text-center text-gray-400 py-4">No more movies.</div>
        )}
      </div>
    </div>
  );
};

export default Popular;
