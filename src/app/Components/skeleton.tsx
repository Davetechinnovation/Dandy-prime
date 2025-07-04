import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`w-full h-[120px] sm:h-[250px] rounded-t-lg bg-gray-800 animate-pulse ${className}`}
    style={{ minHeight: 120 }}
  />
);

export default Skeleton;
