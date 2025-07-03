import React, { useEffect, useState, useRef, useCallback } from "react";
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

// PAGE_SIZE removed (was unused)

const Popular = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef<HTMLDivElement | null>(null);

  const fetchPopular = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/home/all?page=${pageNum}`);
      const data = await res.json();
      const newMovies = data.popular || [];
      setMovies((prev) => {
        const all = [...prev, ...newMovies];
        const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());
        return unique;
      });

      setHasMore(pageNum < (data.totalPages || 1000) && newMovies.length > 0);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopular(page);
  }, [page, fetchPopular]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 400
      ) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

  return (
    <div>
      <div className="text-white pb-10 lg:pb-0 -translate-y-10 sm:px-5 px-2 ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Popular Movies
        </h2>
        <div className="px-2 grid grid-cols-3 md:grid-cols-6 gap-3 ">
          {movies.map((movie) => (
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
          ))}
        </div>
        {loading && <Loader height={60} />}
        {!hasMore && (
          <div className="text-white text-lg py-6">No more movies.</div>
        )}
        <div ref={loader} />
      </div>
    </div>
  );
};

export default Popular;
