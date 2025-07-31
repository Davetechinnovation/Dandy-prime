import React from "react";
import ImageWithSkeleton from "./ImageWithSkeleton";
import { Star, Bookmark, PlayCircle } from "lucide-react";
import Link from "next/link";

export type Movie = {
  id: number;
  title: string;
  image: string | null;
  year: string | null;
  rating: number;
};

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [showOverlay, setShowOverlay] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Hide overlay when clicking outside
  // Close overlay on outside click or after 20 seconds
  React.useEffect(() => {
    if (!showOverlay) return;
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowOverlay(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    // Timer to auto-close after 20 seconds
    const timer = setTimeout(() => setShowOverlay(false), 20000);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      clearTimeout(timer);
    };
  }, [showOverlay]);

  return (
    <div
      ref={cardRef}
      className="relative"
      tabIndex={0}
      onClick={() => {
        if (!showOverlay) setShowOverlay(true);
      }}
    >
      <ImageWithSkeleton
        src={movie.image || "/images/sinners.webp"}
        alt={movie.title}
        width={500}
        height={300}
        className="w-full h-[120px] sm:h-[300px] rounded-t-lg object-cover cursor-pointer "
        loading="lazy"
        placeholder="blur"
        blurDataURL="/images/sinners.webp"
      />
      <div className="border border-t-0 border-blue-700 rounded-b-lg px-2 leading-8 ">
        <p className="sm:text-[16px] text-[13px] truncate ">{movie.title}</p>
        <p className="flex items-center justify-between sm:text-[14px] text-[11px] ">
          <span>{movie.year}</span>
          <span className="flex items-center justify-between gap-2 ">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {movie.rating}
          </span>
        </p>
      </div>
      {showOverlay && (
        <div className="w-full h-full bg-blue-700/15 absolute top-0 left-0 cursor-pointer rounded-lg transition-opacity duration-300 z-10">
          <div className="absolute top-2 right-2">
            <Bookmark className="w-5 h-5 cursor-pointer text-blue-700   " />
          </div>
          <div className="absolute bottom-[67px] left-1/2 -translate-x-1/2  ">
            <Link href={`/detail/${movie.id}`}>
              <button
                onClick={(e) => e.stopPropagation()}
                className="bg-blue-700 sm:px-7 px-3 py-[1px] rounded-full border-2 border-blue-700 hover:bg-transparent duration-500 transition-all cursor-pointer text-[12px] sm:text-base text-[white] hover:text-blue-700 flex gap-2 items-center "
              >
                <span>
                  <PlayCircle className="w-3 sm:w-5 sm:h-5 h-3 cursor-pointer" />
                </span>
                Watch
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieCard;
