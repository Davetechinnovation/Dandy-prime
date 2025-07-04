"use client";
import React, { useEffect, useState } from "react";
import ImageWithSkeleton from "../Components/ImageWithSkeleton";
import { Star } from "lucide-react";
import Loader from "../Components/Loader";
import Toprated from "./Toprated";
import Popular from "./Popular";

type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating?: string | number | null;
  media_type?: string;
  video?: boolean;
};
const Asian: React.FC = () => {
  return (
    <>
      <div className="text-white -translate-y-10 sm:px-5 px-2 ">
        <h2 className="sm:text-[30px] text-[23px] font-semibold py-4 ">
          New Released Asian Drama
        </h2>
        <NewReleasesSection />
      </div>
      <Toprated />
      <Popular />
    </>
  );
};

// NewReleasesSection fetches and displays new releases with its own loader
const NewReleasesSection = () => {
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNewReleases() {
      setLoading(true);
      try {
        const res = await fetch("/api/home/asian");
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
    <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[10px]">
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
            <div className="border 5vh] border-t-0 border-blue-700 rounded-b-lg px-2 leading-8 ">
              <p className="sm:text-[16px] text-[13px] truncate">
                {movie.title}
              </p>
              <p className="flex items-center justify-between sm:text-[14px] text-[11px] ">
                <span>{movie.year || "-"}</span>
                <span className="flex items-center justify-between gap-2 ">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />{" "}
                  {typeof movie.rating === "number"
                    ? movie.rating.toFixed(1)
                    : Number(movie.rating || 0).toFixed(1)}
                </span>
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Asian;
