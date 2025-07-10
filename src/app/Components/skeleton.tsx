import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`w-full rounded-t-lg bg-gray-800 animate-pulse ${className}`}
  />
);

export default Skeleton;
