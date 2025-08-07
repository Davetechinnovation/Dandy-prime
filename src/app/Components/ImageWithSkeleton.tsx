"use client";
import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import Skeleton from "./skeleton";

const ImageWithSkeleton = (props: ImageProps) => {
  const [loading, setLoading] = useState(true);

  // Check if the fill prop is present
  const isFill = props.fill;
  const height = props.height ? `${props.height}px` : (isFill ? '100%' : 'auto');

  return (
    <div className={`relative ${props.className || ""}`} style={{ height }}>
      {loading && <Skeleton className="absolute inset-0" />}
      <Image
        {...props}
        alt={props.alt || ""}
        onLoad={() => {
          setTimeout(() => {
            setLoading(false);
          }, 200); // 200ms delay
        }}
        className={`${props.className || ""} ${
          loading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-500`}
        unoptimized
      />
    </div>
  );
};

export default ImageWithSkeleton;
