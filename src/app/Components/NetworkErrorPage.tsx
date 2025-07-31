"use client";
import React, { useEffect } from 'react';
import { Play, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

type NetworkErrorPageProps = {
  show: boolean;
  onRetry?: () => void;
};

const NetworkErrorPage = ({ show, onRetry }: NetworkErrorPageProps) => {
  useEffect(() => {
    if (!show || !onRetry) return;
    const handleOnline = () => {
      onRetry();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [show, onRetry]);

  if (!show) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center min-w-[320px]"
    >
      <div className="flex flex-col items-center gap-4 px-4 text-center">
        {/* Logo */}
        <div className="bg-black p-3 rounded-3xl border-2 border-red-700">
          <h1 className="text-red-700 flex items-center gap-[5px] font-extrabold text-[50px] sm:text-[70px] [transform:scaleY(1.4)]">
            <span>D</span>
            <span>
              <Play className="w-4 h-4 fill-red-700" />
            </span>
            <span>P</span>
          </h1>
        </div>

        {/* Brand */}
        <div>
          <p className="text-white text-center font-bold text-[22px] sm:text-[32px]">
            <span>Dandy</span> <span className="text-red-700">Prime</span>
          </p>
        </div>

        {/* Error Message */}
        <div className="flex flex-col items-center gap-3 max-w-md">
          <WifiOff className="w-16 h-16 text-red-700" />
          <h2 className="text-white text-xl sm:text-2xl font-bold">
            Unable to load this page
          </h2>
          <p className="text-gray-300 text-sm sm:text-base">
            Dandy Prime couldn&apos;t connect to the internet. Check your connection and we&apos;ll automatically retry when it&apos;s back.
          </p>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors mt-4"
          >
            Try Again
          </button>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span>Waiting for connection...</span>
        </div>
      </div>
    </motion.div>
  );
};

export default NetworkErrorPage;
