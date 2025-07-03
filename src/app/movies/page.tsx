"use client";

import React, { useState } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";

const All = dynamic(() => import("../All/page"), { ssr: false });
const Hollywood = dynamic(() => import("../Hollywood/page"), { ssr: false });
const Bollywood = dynamic(() => import("../Bollywood/page"), { ssr: false });
const Asian = dynamic(() => import("../Asian/page"), { ssr: false });
const Nollywood = dynamic(() => import("../Nollywood/page"), { ssr: false });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function AllTab({ onLoaded }: { onLoaded: () => void }) {
  const { error, isLoading } = useSWR("/api/home/all", fetcher);
  React.useEffect(() => {
    if (!isLoading) onLoaded();
  }, [isLoading, onLoaded]);
  if (isLoading) return null; // Don't show inner loader, let global loader handle
  if (error) return <div className="text-red-500">Failed to load</div>;
  return <All />;
}

function HollywoodTab() {
  // You can implement SWR for Hollywood if needed
  return <Hollywood />;
}

function BollywoodTab() {
  // You can implement SWR for Bollywood if needed
  return <Bollywood />;
}

function AsianTab() {
  const { error, isLoading } = useSWR("/api/home/asian", fetcher);
  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-500">Failed to load</div>;
  return <Asian />;
}

function NollywoodTab() {
  // You can implement SWR for Nollywood if needed
  return <Nollywood />;
}

const Page = ({ onAllTabsLoaded }: { onAllTabsLoaded?: () => void }) => {
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Hollywood", "Bollywood", "Asian", "Nollywood"];

  return (
    <div>
      <div className="overflow-x-auto scrollbar-non text-white flex justify-between py-5 px-2 sm:p-5 sm:px-20 gap-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`border-2 border-blue-700 rounded-full px-3 cursor-pointer hover:bg-blue-700 focus:bg-blue-700 duration-500 transition-all ${
              activeTab === tab ? "bg-blue-700" : ""
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div style={{ display: activeTab === "All" ? "block" : "none" }}>
          <AllTab onLoaded={onAllTabsLoaded || (() => {})} />
        </div>
        <div style={{ display: activeTab === "Hollywood" ? "block" : "none" }}>
          <HollywoodTab />
        </div>
        <div style={{ display: activeTab === "Bollywood" ? "block" : "none" }}>
          <BollywoodTab />
        </div>
        <div style={{ display: activeTab === "Asian" ? "block" : "none" }}>
          <AsianTab />
        </div>
        <div style={{ display: activeTab === "Nollywood" ? "block" : "none" }}>
          <NollywoodTab />
        </div>
      </div>
    </div>
  );
};

export default Page;
