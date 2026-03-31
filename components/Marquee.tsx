"use client";

const SERVICES = [
  "SEO and Market Research",
  "Developer Advocacy",
  "Product Demo",
  "Branding and Design",
  "Blog, Tutorial, and Guide Writing",
  "Short-form and Long-form Video Production",
  "Content Marketing",
];

export default function Marquee() {
  const content = SERVICES.map((service) => `*${service}`).join(" ");

  return (
    <div className="relative flex overflow-x-hidden bg-primary py-3 select-none border-y border-black/10">
      {/* 
          Using two identical flex containers that both animate from 0 to -100%.
          This creates a seamless loop without gaps or stacking.
      */}
      <div className="flex whitespace-nowrap animate-marquee">
        <span className="font-josefin font-bold text-xs lg:text-sm text-background uppercase tracking-[0.15em] px-4">
          {content} {content}
        </span>
        <span className="font-josefin font-bold text-xs lg:text-sm text-background uppercase tracking-[0.15em] px-4">
          {content} {content}
        </span>
      </div>

      <div className="flex whitespace-nowrap animate-marquee">
        <span className="font-josefin font-bold text-xs lg:text-sm text-background uppercase tracking-[0.15em] px-4">
          {content} {content}
        </span>
        <span className="font-josefin font-bold text-xs lg:text-sm text-background uppercase tracking-[0.15em] px-4">
          {content} {content}
        </span>
      </div>
    </div>
  );
}
