"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import { useNetworkRecovery } from "../hooks/useNetworkRecovery";
import { div } from "framer-motion/client";

const NetworkStatus = () => {
  const { isOnline, showReconnected } = useNetworkRecovery();

  return (
    <AnimatePresence mode="wait">
      <div className="flex justify-center items-center">
        {!isOnline && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className=" max-w-[350px] w-full  fixed rounded-lg top-[88px]   bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 z-50"
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You&apos;re offline</span>
          </motion.div>
        )}
      </div>
      <div className="flex justify-center items-center">
        {showReconnected && (
          <motion.div
            key="reconnected"
            initial={{ opacity: 0, y: -50, backgroundColor: "#dc2626" }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundColor: "#16a34a",
              transition: {
                backgroundColor: { duration: 0.8, ease: "easeInOut" },
                opacity: { duration: 0.3 },
                y: { duration: 0.3 },
              },
            }}
            exit={{ opacity: 0, y: -50 }}
            className="max-w-[350px] w-full  fixed rounded-lg top-[88px] text-white px-4 py-2 flex items-center justify-center gap-2 z-50"
          >
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">
              Back online - updating content...
            </span>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default NetworkStatus;
