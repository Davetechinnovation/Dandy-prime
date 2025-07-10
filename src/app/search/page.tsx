import React from "react";

const page = () => {
  return (
    <div className="min-h-screen ">
      <div className="sm:pt-[88px] pt-[99px]  sm:px-5 px-3 ">
        <div className="relative w-full">
          <div className="w-full ">
            <input
              type="search"
              name="search"
              placeholder="Search for movies or shows by title or actor..."
              className="w-full px-4 py-2 rounded-full border border-blue-700 bg-black text-white focus:outline-none focus:border-blue-700 transition duration-200"
            />

            
          </div>
        </div>
        <h2 className="text-white font-bold text-[25px] py-3 ">Trending Today 🔥</h2>
      </div>
    </div>
  );
};

export default page;
