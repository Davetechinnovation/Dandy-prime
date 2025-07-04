"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import ImageWithSkeleton from "../Components/ImageWithSkeleton";
import { Star } from "lucide-react";
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
      <div className="text-white -translate-y-10 sm:px-5 px-2">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[10px]">
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
              // If there are duplicates, append idx to ensure uniqueness
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
                <div
                  key={key}
                  ref={isLast ? lastMovieRef : undefined}
                  className=""
                >
                  <ImageWithSkeleton
                    src={movie.image || "/images/sinners.webp"}
                    alt={movie.title}
                    width={500}
                    height={250}
                    className="w-full h-[120px] sm:h-[250px] rounded-t-lg object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="/images/sinners.webp"
                  />
                  <div className="border border-t-0 border-blue-700 rounded-b-lg px-2 leading-8 ">
                    <p className="sm:text-[16px] text-[13px] truncate ">
                      {movie.title}
                    </p>
                    <p className="flex items-center justify-between sm:text-[14px] text-[11px] ">
                      <span>{movie.year}</span>
                      <span className="flex items-center justify-between gap-2 ">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        {movie.rating}
                      </span>
                    </p>
                  </div>
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
