import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import Hero from "@/components/Hero";

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero prefix="Meet the" title="Founder" />

      {/* Jaden Profile Section */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-24 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col">
            <h2 className="font-josefin font-semibold text-5xl lg:text-7xl text-black leading-tight">
              Jaden Baptista
            </h2>
            <p className="font-girassol text-3xl lg:text-5xl text-primary uppercase leading-tight">
              Founder of Authors Collective
            </p>
          </div>
          <p className="font-josefin text-lg lg:text-xl text-black leading-relaxed tracking-wide">
            Jaden Baptista is the founder of Authors Collective, a collaborative company focused on
            creating high-quality work by bringing together experts from their respective fields.
            By matching each project with specialists best suited for the task, Jaden ensures every
            piece of work is crafted with precision and expertise.
          </p>
        </div>

        {/* Profile Image Placeholder */}
        <div className="relative w-full lg:w-[400px] h-[400px] rounded-[24px] bg-muted overflow-hidden border-2 border-black">
          <img
            src="/assets/jaden.jpeg"
            alt="Jaden Baptista"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
          />
        </div>
      </section>

      {/* Straight Marquee - Matching Homepage aesthetic on all devices */}
      <section className="py-12 lg:py-20 overflow-hidden relative border-y border-black/10">
        <Marquee />
      </section>

      <Footer />
    </main>
  );
}
