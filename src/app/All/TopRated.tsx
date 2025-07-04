import React from "react";
import { useQuery } from '@tanstack/react-query';
import ImageWithSkeleton from "../Components/ImageWithSkeleton";
import { Star } from "lucide-react";
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
    queryKey: ['allTopRated'],
    queryFn: async () => {
      const res = await fetch("/api/home/all");
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
  const topRated: Movie[] = data?.topRated || [];
  const loading = isLoading;

  return (
    <div>
      <div className="text-white -translate-y-10 sm:px-5 px-2 ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          Top Rated Movies
        </h2>
        {loading ? (
          <Loader />
        ) : (
          <div className="px-2 grid grid-cols-3 md:grid-cols-6 gap-[10px] ">
            {topRated.map((movie) => (
              <div key={movie.id} className="">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopRated;
