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
  media_type: "movie" | "tv";
};

interface MovieCardProps {
  movie: Movie;
  size?: "default" | "small";
  width?: string;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  size = "default",
  width,
}) => {
  const [showOverlay, setShowOverlay] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const isSmall = size === "small";

  React.useEffect(() => {
    if (!showOverlay) return;
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowOverlay(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    const timer = setTimeout(() => setShowOverlay(false), 20000);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      clearTimeout(timer);
    };
  }, [showOverlay]);

  return (
    <div
      ref={cardRef}
      className={`relative ${
        width ? width : isSmall ? "min-w-[100px] w-[150px]  " : ""
      }`}
      tabIndex={0}
      onClick={() => {
        if (!showOverlay) setShowOverlay(true);
      }}
    >
      <ImageWithSkeleton
        src={movie.image || "/images/sinners.webp"}
        alt={movie.title}
        width={isSmall ? 150 : 500}
        height={isSmall ? 0 : 0}
        className="w-full rounded-t-lg object-cover cursor-pointer h-[160px] sm:h-[300px]  "
        loading="lazy"
        placeholder="blur"
        blurDataURL="/images/sinners.webp"
      />

      <div
        className={`border border-t-0 flex  flex-col gap-2 border-blue-700 rounded-b-lg px-1 leading-6`}
      >
        <p className="truncate text-[12px] sm:text-[16px]">{movie.title}</p>
        <p className="flex items-center justify-between text-[11px] sm:text-[14px]">
          <span>{movie.year}</span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {movie.rating}
          </span>
        </p>
      </div>

      {showOverlay && (
        <div className="w-full h-full bg-blue-700/15 absolute top-0 left-0 cursor-pointer rounded-lg transition-opacity duration-300 z-10">
          <div className="absolute top-2 right-2">
            <Bookmark className="w-5 h-5 cursor-pointer text-blue-700" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4">
            <Link href={`/detail/${movie.media_type}/${movie.id}`}>
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
