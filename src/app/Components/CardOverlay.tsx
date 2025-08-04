import { useEffect, useRef, useState } from "react";
import { Bookmark, PlayCircle } from "lucide-react";
import Link from "next/link";

interface CardOverlayProps {
  movieId: number;
  mediaType: "movie" | "tv"; // NEW
 children?: React.ReactNode;
}

const CardOverlay = ({ movieId, mediaType, children }: CardOverlayProps) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showOverlay) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowOverlay(false);
      }
    };
    const timer = setTimeout(() => setShowOverlay(false), 20000);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(timer);
    };
  }, [showOverlay]);

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 cursor-pointer"
      onClick={() => {
        if (!showOverlay) setShowOverlay(true);
      }}
    >
      {children}

      {showOverlay && (
        <div className="w-full h-full bg-blue-700/15 absolute top-0 left-0 cursor-pointer rounded-lg transition-opacity duration-300 z-10">
          <div className="absolute top-2 right-2">
            <Bookmark className="w-5 h-5 cursor-pointer text-blue-700" />
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <Link href={`/detail/${mediaType}/${movieId}`}>
              <button
                onClick={(e) => e.stopPropagation()}
                className="bg-blue-700 px-3 py-1 rounded-full border-2 border-blue-700 hover:bg-transparent duration-500 transition-all cursor-pointer text-white hover:text-blue-700 flex gap-2 items-center text-xs sm:text-sm"
              >
                <PlayCircle className="w-4 h-4" />
                Watch
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardOverlay;
