"use client";

import { useEffect, useState } from "react";

interface HeroProps {
  prefix: string;
  title: string;
  typewriterText?: string;
  subheader?: string;
}

export default function Hero({ prefix, title, typewriterText, subheader }: HeroProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!typewriterText) return;
    let i = 0;
    const typingInterval = setInterval(() => {
      setTyped(typewriterText.slice(0, i));
      i++;
      if (i > typewriterText.length) {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [typewriterText]);

  return (
    <section className="relative px-6 pt-[72px] lg:pt-[100px] min-h-screen flex flex-col items-center justify-between text-center overflow-hidden">
      {/* Centering Branding in the remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center select-none w-full max-w-[1400px]">
        {/* PREFIX (e.g. THE or MEET THE) - Girassol */}
        <span className="font-girassol text-4xl lg:text-5xl text-black uppercase mb-2 z-10">
          {prefix}
        </span>

        {/* TITLE (e.g. AUTHORS or TEAM) - Josefin Sans Giant */}
        <h1 className="font-josefin font-bold text-[20vw] leading-[1] text-primary uppercase tracking-tighter mb-[-0.2em] mt-[0.1em]">
          {title}
        </h1>

        {/* Dynamic type-in section with blinking cursor - only if typewriterText provided */}
        {typewriterText && (
          <div className="flex items-center gap-2 lg:gap-4 mt-4 lg:mt-8">
            <span className="font-josefin font-bold text-4xl lg:text-7xl text-black uppercase tracking-[0.2em] min-h-[1.2em]">
              {typed}
            </span>
            <div className="w-1 lg:w-2 h-10 lg:h-16 bg-primary animate-pulse mb-4 lg:mb-8" />
          </div>
        )}
      </div>

      {/* Floating Subheader (Frame 11) - Anchored to bottom of 100vh */}
      <div className="pb-6 border-y border-black/10 py-6 w-full max-w-[1200px] mt-auto">
        <p className="font-josefin font-bold text-xl lg:text-2xl text-black uppercase tracking-wider">
          {subheader}
        </p>
      </div>
    </section>
  );
}
