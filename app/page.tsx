import Navbar from "@/components/Navbar";
import Marquee from "@/components/Marquee";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Caro from "@/components/Caro";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero prefix="The" title="Authors" typewriterText="Collective" subheader="A team you already know making content you already love" />

      {/* Marquee */}
      <Marquee />

      {/* Content Section 3 (What We Do) */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-24 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        <div className="flex-1 flex flex-col gap-4 text-left">
          <h2 className="font-josefin font-semibold text-5xl lg:text-7xl text-primary uppercase leading-tight">
            What we do
          </h2>
          <p className="font-girassol text-3xl lg:text-5xl text-black uppercase leading-tight">
            High-quality content by seasoned professionals
          </p>
        </div>

        {/* Red Separator */}
        <div className="hidden lg:block w-1 h-56 bg-primary" />

        <div className="flex-1">
          <p className="font-josefin text-lg lg:text-xl text-black text-justify leading-relaxed tracking-wide">
            With the Authors Collective, you can be as hands-on or hands-off as you like. It's technical writing, video-editing, natural-language-translation, product marketing, community auditing, and course-teaching, just without all the babysitting and handholding. We'll handle as much as you're comfortable with, from dreaming up the best ideas to sending the final piece off into the world. Whatever you need, we'll blend modern technology and old-school work ethic to make it happen.
          </p>
        </div>
      </section>

      {/* Caro Process Carousel */}
      <Caro />

      {/* Content Section 4 (Who Are We) */}
      <section className="bg-[#dfddd2] max-w-full">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-24 py-20 lg:py-32 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
          <div className="flex-1 flex flex-col items-start gap-8">
            <p className="font-josefin text-lg lg:text-xl text-black text-justify leading-relaxed tracking-wide">
              We're a collective of authors with day jobs at Slack, Adobe, GitHub, AWS, Netflix, and others. Tailored teams producing high-signal content for developer tools, hired per-project. No long-term agency bloat.
            </p>
            <Link
              href="/team"
              className="border-2 border-black px-8 py-3 rounded-xl font-girassol text-2xl uppercase hover:bg-black hover:text-white transition-all"
            >
              About the founder
            </Link>
          </div>

          {/* Red Separator */}
          <div className="hidden lg:block w-1 h-56 bg-primary" />

          <div className="flex-1 flex flex-col gap-4 text-left">
            <h2 className="font-josefin font-semibold text-5xl lg:text-7xl text-primary uppercase leading-tight">
              Who are we
            </h2>
            <p className="font-girassol text-3xl lg:text-5xl text-black uppercase leading-tight">
              A loose collective of senior content experts
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof (Testimonials) */}
      <section className="bg-background px-6 lg:px-24 py-20 lg:py-32">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center">
          <h2 className="font-josefin font-bold text-2xl lg:text-3xl text-black uppercase tracking-widest text-center mb-16">
            What some folks have had to say about us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {[
              {
                quote: "Actually one of the best genuine attempts at explaining Jamstack I've seen in years. Nicely done",
                project: "TakeShape's review of the Jamstack identity crisis",
                author: "Shawn Wang (swyx)",
                company: "one of the world's foremost dev-focused content creators",
                image: "https://www.swyx.io/swyx-ski.jpeg"
              },
              {
                quote: "You're solving a good problem here - awesome!",
                project: "our work with Algolia",
                author: "Scott Mathson",
                company: "creator of Plink, formerly in marketing at Algolia",
                image: "https://scottmathson.com/assets/img/scott-mathson-photo-missoula-2023.JPG"
              },
              {
                quote: "Thank you SO MUCH @jbaptista!! And kudos to you for taking on Hugo!",
                project: "the Mattermost Contributor Guide",
                author: "Carrie Warner",
                company: "Community Coordinator and Lead Technical Writer at Mattermost",
                image: "https://mattermost.com/wp-content/uploads/2021/03/Carrie-Warner-e1619991818834.webp"
              },
            ].map(({ quote, project, author, company, image }, i) => (
              <div
                key={i}
                className="relative bg-white/50 backdrop-blur-sm p-8 lg:p-10 rounded-3xl border border-black/5 flex flex-col gap-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden"
              >
                {/* Large Background Quote Ornament */}
                <span className="absolute -top-6 -right-0 p-3 font-girassol text-[120px] text-primary/5 select-none pointer-events-none group-hover:text-primary/10 transition-colors duration-500">
                  "
                </span>

                <h3 className="font-girassol italic text-2xl lg:text-3xl text-black leading-tight relative z-10">
                  "{quote}"
                </h3>

                <div className="flex flex-col gap-4 mt-auto pt-8 border-t border-black/5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 aspect-square rounded-full overflow-hidden border-2 border-primary/20 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-inner shrink-0">
                      <img
                        src={image}
                        alt={author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-josefin font-bold text-lg text-black leading-none">
                        {author}
                      </h4>
                      <p className="font-josefin text-sm text-muted uppercase tracking-wider mt-1">
                        {company}
                      </p>
                    </div>
                  </div>
                  <p className="font-josefin text-xs text-primary/60 italic tracking-wide">
                    Regarding {project}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
