"use client";

import Link from "next/link";
import { Menu, X, Home, Tv, Clapperboard, Info, Mail, FileText, Settings } from "lucide-react";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const Section = () => {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (navOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [navOpen]);

  return (
    <div>
      <nav className="z-50 fixed top-0 left-0 w-[100%] bg-black border-b border-b-blue-700 text-white sm:px-6 px-3 sm:py-3 py-6 flex  items-center justify-between gap-3 ">
        <Link href="/">
          <h1 className="sm:text-[29px] text-[24px] font-extrabold ">
            <span>Dandy</span> <span className="text-blue-700">Prime</span>
          </h1>
        </Link>
        <div className="block lg:hidden">
          {navOpen ? (
            <span onClick={() => setNavOpen(false)}>
              <X size={28} />
            </span>
          ) : (
            <span onClick={() => setNavOpen(true)}>
              <Menu size={28} />
            </span>
          )}
        </div>
        <ul className=" gap-6 text-sm font-semibold lg:flex hidden">
          <li className={`hover:text-blue-700 duration-500 transition-all ${pathname === '/' ? 'text-blue-700' : ''}`}>
            <Link href="/">Home</Link>
          </li>
          <li className={`hover:text-blue-700 duration-500 transition-all ${pathname === '/live' ? 'text-blue-700' : ''}`}>
            <Link href="/live">Live TV</Link>
          </li>
          <li className={`hover:text-blue-700 duration-500 transition-all ${pathname === '/kdramas' ? 'text-blue-700' : ''}`}>
            <Link href="/kdramas">K-Dramas</Link>
          </li>
          <li className={`hover:text-blue-700 duration-500 transition-all ${pathname === '/about' ? 'text-blue-700' : ''}`}>
            <Link href="/about">About</Link>
          </li>
          <li className={`hover:text-blue-700 duration-500 transition-all ${pathname === '/contact' ? 'text-blue-700' : ''}`}>
            <Link href="/contact">Contact us</Link>
          </li>
          <li className={`hover:text-blue-700 duration-500 transition-all ${pathname === '/policies' ? 'text-blue-700' : ''}`}>
            <Link href="/policies">Terms & Privacy</Link>
          </li>
          <li className={`hover:text-blue-700 duration-500 transition-all ${pathname === '/settings' ? 'text-blue-700' : ''}`}>
            <Link href="/settings">Settings</Link>
          </li>
        </ul>
      </nav>

      {/* Overlay and sliding nav */}
      {/* Animated top-down mobile nav, only animating the blue menu */}
      {/* Always render overlay and menu for animation to work */}
      <div
        className={`fixed inset-0 z-40 flex lg:hidden transition-opacity duration-300 ${
          navOpen
            ? "bg-black/50 opacity-100 pointer-events-auto"
            : "bg-black/0 opacity-0 pointer-events-none"
        }`}
        style={{ transitionProperty: "opacity, background-color" }}
      >
        <div
          className={`fixed top-[50px] pb-20 right-0 z-50 h-screen max-h-screen overflow-y-auto py-5 pl-14 w-[90%] bg-blue-800 transition-transform duration-300 flex flex-col ${
            navOpen ? "translate-y-0" : "-translate-y-full"
          }`}
          style={{
            boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
            transitionProperty: "transform",
          }}
        >
          <ul className="text-sm font-semibold flex flex-col gap-10  text-white text-[16px] mt-10">
            <li className={`hover:text-blue-700 duration-500 transition-all flex items-center gap-2 ${pathname === '/' ? 'underline' : ''}`}>
               <Home size={20} className="text-white" />
              <Link href="/" onClick={() => setNavOpen(false)} className={pathname === '/' ? 'underline' : ''}>
                Home
              </Link>
            </li>
            <li className={`hover:text-blue-700 duration-500 transition-all flex items-center gap-2 ${pathname === '/live' ? 'underline' : ''}`}>
              <Tv size={20} className="text-white" />
              <Link href="/live" onClick={() => setNavOpen(false)} className={pathname === '/live' ? 'underline' : ''}>
                Live TV
              </Link>
            </li>
            <li className={`hover:text-blue-700 duration-500 transition-all flex items-center gap-2 ${pathname === '/kdramas' ? 'underline' : ''}`}>
              <Clapperboard size={20} className="text-white" />
              <Link href="/kdramas" onClick={() => setNavOpen(false)} className={pathname === '/kdramas' ? 'underline' : ''}>
                K-Dramas
              </Link>
            </li>
            <li className={`hover:text-blue-700 duration-500 transition-all flex items-center gap-2 ${pathname === '/about' ? 'underline' : ''}`}>
              <Info size={20} className="text-white" />
              <Link href="/about" onClick={() => setNavOpen(false)} className={pathname === '/about' ? 'underline' : ''}>
                About
              </Link>
            </li>
            <li className={`hover:text-blue-700 duration-500 transition-all flex items-center gap-2 ${pathname === '/contact' ? 'underline' : ''}`}>
              <Mail size={20} className="text-white" />
              <Link href="/contact" onClick={() => setNavOpen(false)} className={pathname === '/contact' ? 'underline' : ''}>
                Contact us
              </Link>
            </li>
            <li className={`hover:text-blue-700 duration-500 transition-all flex items-center gap-2 ${pathname === '/policies' ? 'underline' : ''}`}>
              <FileText size={20} className="text-white" />
              <Link href="/policies" onClick={() => setNavOpen(false)} className={pathname === '/policies' ? 'underline' : ''}>
                Terms & Privacy
              </Link>
            </li>
            <li className={`hover:text-blue-700 duration-500 transition-all flex items-center gap-2 ${pathname === '/settings' ? 'underline' : ''}`}>
              <Settings size={20} className="text-white" />
              <Link href="/settings" onClick={() => setNavOpen(false)} className={pathname === '/settings' ? 'underline' : ''}>
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default Section;
