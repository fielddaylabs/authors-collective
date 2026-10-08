import Image from "next/image";
import Link from "next/link";
import type { CaseStudy, CaseStudyLink } from "@/lib/case-studies";

function ActionLink({ link, primary = false }: { link: CaseStudyLink; primary?: boolean }) {
  const className = primary
    ? "inline-flex min-h-12 items-center rounded-xl bg-primary px-5 py-3 font-josefin text-sm font-semibold text-white transition-opacity hover:opacity-80"
    : "inline-flex min-h-12 items-center rounded-xl border-2 border-black px-5 py-3 font-josefin text-sm font-semibold transition-colors hover:bg-black hover:text-white";
  const children = <>{link.label} <span aria-hidden="true" className="ml-2">↗</span></>;
  return link.href.startsWith("/") ? <Link href={link.href} className={className}>{children}</Link> : <a href={link.href} className={className}>{children}</a>;
}

export default function CaseStudyTemplate({ study, html }: { study: CaseStudy; html: string }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <nav className="flex items-center justify-between border-b border-black/10 py-5 font-josefin text-xs uppercase tracking-[0.16em]">
          <Link href="/" className="font-semibold">Authors Collective</Link>
          <Link href="/team" className="text-black/55 underline underline-offset-4">About the collective</Link>
        </nav>

        <article>
          <header className="grid gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end lg:gap-20 lg:py-32">
            <div className="max-w-4xl">
              <p className="font-josefin text-xs font-semibold uppercase tracking-[0.22em] text-primary">{study.kicker}</p>
              <h1 className="mt-7 max-w-4xl font-girassol text-6xl leading-[0.96] text-black sm:text-7xl lg:text-[clamp(5rem,9vw,9.5rem)]">{study.title}</h1>
              <p className="mt-8 max-w-2xl font-josefin text-xl leading-relaxed text-black/65 lg:text-2xl">{study.lede}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ActionLink link={study.primaryCta} primary />
                {study.secondaryCta && <ActionLink link={study.secondaryCta} />}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t-2 border-black pt-6 font-josefin text-sm">
              {study.facts.map((fact) => <div key={fact.label}><dt className="text-xs uppercase tracking-[0.16em] text-black/45">{fact.label}</dt><dd className="mt-2 text-black">{fact.value}</dd></div>)}
            </dl>
          </header>

          {study.heroImage && <figure className="relative aspect-[16/7] overflow-hidden rounded-[28px] border border-black/10 bg-white/50"><Image src={study.heroImage} alt={study.heroImageAlt || study.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 90vw" priority /></figure>}

          <div className="grid gap-14 py-20 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-24 lg:py-28">
            <aside className="self-start lg:sticky lg:top-8">
              <p className="font-josefin text-xs font-semibold uppercase tracking-[0.2em] text-primary">The people behind it</p>
              <div className="mt-6 grid gap-6">
                {study.roles.map((role) => <div key={role.label} className="border-t border-black/15 pt-4"><p className="font-josefin text-xs uppercase tracking-[0.16em] text-black/45">{role.label}</p><p className="mt-2 font-girassol text-2xl text-black">{role.href ? <a href={role.href} className="underline decoration-primary decoration-2 underline-offset-4">{role.name}</a> : role.name}</p><p className="mt-2 font-josefin text-sm leading-relaxed text-black/60">{role.description}</p></div>)}
              </div>
            </aside>
            <div className="case-study-prose max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          <footer className="flex flex-col gap-6 border-t-2 border-black py-10 font-josefin sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-relaxed text-black/60">A case study for {study.client}, by {study.roles.map((role, index) => <span key={role.name}>{index > 0 && " · "}{role.href ? <a href={role.href} className="text-black underline decoration-primary decoration-2 underline-offset-4">{role.name}</a> : role.name}</span>)}.</p>
            <ActionLink link={study.primaryCta} />
          </footer>
        </article>
      </div>
    </main>
  );
}
