import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import Skeleton from "./skeleton";

const ImageWithSkeleton: React.FC<ImageProps> = ({ ...props }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return <Skeleton />;
  }

  return (
    <>
      {!imgLoaded && <Skeleton />}
      <Image
        {...props}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
        style={{ display: imgLoaded ? "block" : "none" }}
      />
    </>
  );
};

export default ImageWithSkeleton;
