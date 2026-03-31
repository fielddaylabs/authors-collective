"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] bg-white border-b border-black select-none">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-[72px] lg:h-[100px] flex items-center justify-between relative">

        {/* LOGO - THE AUTHORS COLLECTIVE */}
        <Link
          href="/"
          className="font-girassol text-xl lg:text-3xl text-primary leading-tight tracking-tighter uppercase whitespace-nowrap"
        >
          The Authors Collective
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden lg:flex items-center gap-10">
          <Link
            href="/team"
            className="font-girassol text-2xl uppercase text-black/60 hover:text-primary transition-colors"
          >
            Meet Jaden
          </Link>
          <Link
            href="mailto:jaden@authorscollective.org"
            className="border-2 border-black px-8 py-3 rounded-xl font-girassol text-2xl uppercase hover:bg-black hover:text-white transition-all"
          >
            Hire us
          </Link>
        </div>

        {/* MOBILE TOGGLE (Red Plus Icon) */}
        <button
          onClick={toggleMenu}
          className="lg:hidden flex items-center justify-center w-10 h-10 text-primary transition-all duration-300 ease-in-out"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          aria-label="Toggle Menu"
        >
          {/* Symmetrical Plus Icon */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-full h-[3px] bg-current rounded-full" />
            <div className="absolute w-[3px] h-full bg-current rounded-full" />
          </div>
        </button>

        {/* MOBILE OVERLAPPING MENU */}
        <div
          className={`
            fixed inset-x-0 top-[72px] bg-background border-b border-black shadow-2xl transition-all duration-300 ease-out z-[99]
            ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}
          `}
        >
          <div className="flex flex-col p-8 gap-10 items-center justify-center text-center">
            <Link
              href="/"
              className={`font-girassol text-4xl uppercase ${pathname === '/' ? 'text-primary' : 'text-black'}`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/team"
              className={`font-girassol text-4xl uppercase ${pathname === '/team' ? 'text-primary' : 'text-black'}`}
              onClick={() => setIsOpen(false)}
            >
              Who we are
            </Link>
            <Link
              href="mailto:jaden@authorscollective.org"
              className="font-girassol text-4xl uppercase text-primary border-b-4 border-primary"
              onClick={() => setIsOpen(false)}
            >
              Hire an expert
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
