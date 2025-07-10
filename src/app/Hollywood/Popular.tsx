"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import MovieCard from "../Components/MovieCard";

import Loader from "../Components/Loader";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
  media_type?: string;
};

const Popular = () => {
  const [popular, setPopular] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    setPopular([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    async function fetchPopular() {
      setLoading(true);
      try {
        const res = await fetch(`/api/home/hollywood?page=${page}`);
        const data = await res.json();
        if (data.popular && data.popular.length > 0) {
          setPopular((prev) => [...prev, ...data.popular]);
          setHasMore(data.popular.length > 0 && page < data.totalPages);
        } else {
          setHasMore(false);
        }
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }
    if (page === 1 || hasMore) fetchPopular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-[4px]">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-[15px]">
          {popular.length === 0 && loading ? (
            <div className="col-span-3 md:col-span-6 flex justify-center items-center py-8">
              <Loader />
            </div>
          ) : popular.length === 0 ? (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No popular movies found.
            </div>
          ) : (
            popular.map((movie, idx) => {
              const isLast = idx === popular.length - 1;
              // Use composite key for uniqueness, fallback to idx if duplicate
              let key = `${movie.id}-${movie.media_type || "movie"}`;
              if (
                popular.findIndex(
                  (m, i) =>
                    m.id === movie.id &&
                    (m.media_type || "movie") ===
                      (movie.media_type || "movie") &&
                    i < idx
                ) !== -1
              ) {
                key = `${movie.id}-${movie.media_type || "movie"}-${idx}`;
              }
              return (
                <div key={key} ref={isLast ? lastMovieRef : undefined}>
                  <MovieCard movie={movie} />
                </div>
              );
            })
          )}
        </div>
        {loading && popular.length > 0 && (
          <div className="flex justify-center items-center py-4">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;
