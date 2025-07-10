import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`w-full h-[150px] sm:h-[350px] rounded-t-lg bg-gray-800 animate-pulse ${className}`}
    style={{ minHeight: 150 }}
  />
);

export default Skeleton;
