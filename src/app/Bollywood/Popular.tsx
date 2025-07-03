"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
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
      <div className="text-white -translate-y-10 sm:px-5 px-2 ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 ">
          {popular.length === 0 && !loading ? (
            <div className="col-span-3 md:col-span-6 text-center text-gray-400 py-8">
              No popular movies found.
            </div>
          ) : (
            popular.map((movie) => (
              <div key={movie.id} className="">
                <Image
                  src={movie.image || "/images/sinners.webp"}
                  alt={movie.title}
                  width={300}
                  height={170}
                  className="w-full sm:h-[25vh] h-[19vh] rounded-t-lg object-cover"
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
            ))
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
