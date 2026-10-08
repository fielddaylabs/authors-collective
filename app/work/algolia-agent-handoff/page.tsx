import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Specialized agent handoff demo | Authors Collective",
  description: "How Authors Collective and Field Day Labs built a practical, application-owned example of handing a conversation from one specialized agent to another.",
};

export default function AgentHandoffAttributionPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground lg:px-24">
      <article className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex max-w-3xl flex-col gap-5">
          <p className="font-josefin text-sm uppercase tracking-[0.2em] text-primary">Authors Collective × Field Day Labs</p>
          <h1 className="font-girassol text-5xl leading-tight lg:text-8xl">A clean handoff between specialized agents</h1>
          <p className="font-josefin text-xl leading-relaxed text-black/70">
            This is the working example that accompanies our article for Algolia: one conversation surface, an application-owned routing decision, and a deliberately small packet of context passed to the next agent.
          </p>
        </header>

        <section className="grid gap-8 border-y border-black/10 py-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="font-josefin text-xs uppercase tracking-[0.2em] text-black/50">Content and direction</p>
            <h2 className="font-girassol text-4xl">Authors Collective</h2>
            <p className="font-josefin leading-relaxed text-black/70">
              Authors Collective shaped the article, example, and editorial framing for a technical audience that needs to understand the boundary between specialized agents and the application that coordinates them.
            </p>
            <Link href="/" className="font-josefin text-sm underline underline-offset-4">Visit Authors Collective</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-josefin text-xs uppercase tracking-[0.2em] text-black/50">Development partner</p>
            <h2 className="font-girassol text-4xl">Field Day Labs</h2>
            <p className="font-josefin leading-relaxed text-black/70">
              Field Day Labs built the browser embed and server boundary: the page can render a compact interactive example, while provider credentials and agent identifiers remain server-side.
            </p>
            <a href="https://www.fieldday.dev/work/algolia-agent-handoff/" className="font-josefin text-sm underline underline-offset-4">Visit Field Day Labs</a>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <p className="font-josefin text-xs uppercase tracking-[0.2em] text-primary">What the demo illustrates</p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/40 p-6">
              <h2 className="font-girassol text-2xl">One surface</h2>
              <p className="mt-3 font-josefin leading-relaxed text-black/70">The reader stays in one conversation while the active specialist changes.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/40 p-6">
              <h2 className="font-girassol text-2xl">Explicit routing</h2>
              <p className="mt-3 font-josefin leading-relaxed text-black/70">The application validates the destination instead of asking the browser to make a privileged decision.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/40 p-6">
              <h2 className="font-girassol text-2xl">Small context packet</h2>
              <p className="mt-3 font-josefin leading-relaxed text-black/70">Only the latest question, a short summary, and approved context move across the boundary.</p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-5 border-t border-black/10 pt-8 font-josefin text-sm">
          <Link href="/agent-handoff/" className="rounded-xl bg-primary px-6 py-3 text-white transition-opacity hover:opacity-80">Open the demo</Link>
          <a href="https://www.fieldday.dev/work/algolia-agent-handoff/" className="rounded-xl border-2 border-black px-6 py-3 transition-colors hover:bg-black hover:text-white">See the build notes</a>
        </div>
      </article>
    </main>
  );
}
