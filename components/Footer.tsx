import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-primary py-12 px-6 lg:px-24">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Info */}
        <div className="flex items-center gap-3 text-center lg:text-left">
          <Image src="/brand/authors-collective-guild-primary.svg" alt="Authors Collective" width={56} height={56} className="shrink-0" />
          <p className="font-josefin font-bold text-lg text-background tracking-widest uppercase">
            The Authors Collective © 2025
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 text-white font-josefin font-medium uppercase tracking-widest">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            Home
          </Link>
          <Link href="/team" className="hover:opacity-70 transition-opacity">
            About
          </Link>
          <Link href="mailto:jaden@authorscollective.org" className="hover:opacity-70 transition-opacity">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
