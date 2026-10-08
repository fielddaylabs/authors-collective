import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyTemplate from "@/components/CaseStudyTemplate";
import { getCaseStudy, getCaseStudySlugs, renderMarkdown } from "@/lib/case-studies";

type CaseStudyPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getCaseStudySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const study = getCaseStudy(slug);
    return {
      title: study.title,
      description: study.description,
      alternates: { canonical: study.canonicalUrl },
      openGraph: { title: study.title, description: study.description, url: study.canonicalUrl, type: "article" },
    };
  } catch {
    return {};
  }
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  let study;

  try {
    study = getCaseStudy(slug);
  } catch {
    notFound();
  }

  const html = await renderMarkdown(study.markdown);
  return <CaseStudyTemplate study={study} html={html} />;
}
