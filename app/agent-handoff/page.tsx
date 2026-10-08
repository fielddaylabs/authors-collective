import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Specialized agent handoff demo | Authors Collective",
  description: "A compact, application-owned example of moving one conversation from a Sales agent to a Support agent.",
};

export default function AgentHandoffPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground lg:px-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <p className="font-josefin text-sm uppercase tracking-[0.2em] text-primary">Authors Collective demonstration</p>
          <h1 className="font-girassol text-5xl leading-tight lg:text-7xl">A clean handoff between specialized agents</h1>
          <p className="max-w-2xl font-josefin text-lg leading-relaxed text-black/70">
            This example keeps one conversation surface while the application validates the destination and transfers only the latest question, a short summary, and approved context.
          </p>
        </div>
        <div data-authors-collective-agent-handoff>
          <div data-handoff-fallback className="grid gap-3 rounded-[18px] border border-black/10 bg-white/40 p-4">
            <a href="/agent-handoff/" className="block">
              <Image src="/brand/authors-collective-guild-primary.png" alt="Interactive example of a handoff between specialized agents" width={1024} height={1024} className="block w-full rounded-xl" />
            </a>
            <span className="font-josefin text-xs text-black/50">Interactive demo by Authors Collective</span>
          </div>
        </div>
        <p className="font-josefin text-sm text-black/55">
          The switch is application-owned. It is not presented as a native Agent Studio agent-to-agent handoff.
        </p>
      </div>
      <Script src="/agent-handoff.js" strategy="afterInteractive" />
    </main>
  );
}
