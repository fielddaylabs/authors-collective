"use client";

import Image from "next/image";

const CARO_ITEMS = [
  { src: "/assets/caro/generate-ideas.png", alt: "Generate Ideas", label: "Generate Ideas" },
  { src: "/assets/caro/create-content.png", alt: "Create Content", label: "Create Content" },
  { src: "/assets/caro/market-to-audience.png", alt: "Market to Audience", label: "Market to Audience" },
  { src: "/assets/caro/final-product.png", alt: "Final Product", label: "Final Product" },
];

export default function Caro() {
  const clipPathStyle = {
    clipPath: "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)",
  };

  const renderItems = (setId: string, isPriority: boolean) => (
    <div className="flex shrink-0 items-center gap-4 lg:gap-8">
      {CARO_ITEMS.map((item, index) => (
        <div
          key={`${setId}-${index}`}
          className="relative h-[120px] lg:h-[185px] w-[300px] lg:w-[450px] group overflow-hidden"
          style={clipPathStyle}
        >
          {/* Background Image Wrapper */}
          <div className="absolute inset-0 z-0 overflow-hidden group-hover:scale-105 transition-transform duration-700">
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 1024px) 300px, 450px"
              priority={isPriority}
            />
            {/* Dark Overlay for Text Legibility (pointer-events-none to let hover through) */}
            <div className="absolute inset-0 bg-black/75 z-10 group-hover:bg-black/40 transition-colors duration-700 pointer-events-none" />
          </div>

          {/* Dynamic Process Text Overlay */}
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-20 lg:px-28">
            <h3 className="font-josefin font-bold text-xl lg:text-3xl text-white uppercase text-center leading-tight tracking-wider drop-shadow-lg drop-shadow-black/50">
              {item.label}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="bg-background py-12 lg:py-20 overflow-hidden relative select-none">
      <div className="relative flex overflow-x-hidden w-full gap-4 lg:gap-8">
        {/* 
            Two identical containers animating from 0 to -100%.
            Combined with the gap, this creates a perfectly seamless loop.
        */}
        <div className="flex shrink-0 items-center gap-4 lg:gap-8 animate-marquee hover:pause">
          {renderItems("set1", true)}
        </div>
        <div className="flex shrink-0 items-center gap-4 lg:gap-8 animate-marquee hover:pause">
          {renderItems("set2", false)}
        </div>
      </div>

      {/* Subtle Container Border */}
      <div className="absolute inset-0 pointer-events-none border-y border-black/5" />
    </section>
  );
}
