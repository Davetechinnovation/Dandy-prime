import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import Skeleton from "./skeleton";

const ImageWithSkeleton: React.FC<ImageProps> = (props) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-full h-[150px] sm:h-[270px] rounded-t-lg overflow-hidden">
      {!imgLoaded && !imgError && <Skeleton className="w-full h-full" />}
      {!imgError && (
        <Image
          {...props}
          unoptimized
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          } ${props.className || ""}`}
          alt="skeleton"
        />
      )}
    </div>
  );
};

export default ImageWithSkeleton;
