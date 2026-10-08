import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

export type CaseStudyLink = { label: string; href: string };
export type CaseStudyRole = { label: string; name: string; description: string; href?: string };
export type CaseStudyFact = { label: string; value: string };

export type CaseStudy = {
  slug: string;
  title: string;
  description: string;
  lede: string;
  year: string;
  client: string;
  category: string;
  canonicalUrl: string;
  heroImage?: string;
  heroImageAlt?: string;
  primaryCta: CaseStudyLink;
  secondaryCta?: CaseStudyLink;
  facts: CaseStudyFact[];
  roles: CaseStudyRole[];
  markdown: string;
};

const contentDirectory = path.join(process.cwd(), "content", "case-studies");

function requiredString(value: unknown, key: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Case study frontmatter requires ${key}.`);
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function links(value: unknown, key: string): CaseStudyLink[] {
  if (!Array.isArray(value)) throw new Error(`Case study frontmatter requires ${key} to be a list.`);
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error(`Invalid ${key} entry.`);
    const entry = item as Record<string, unknown>;
    return { label: requiredString(entry.label, `${key}.label`), href: requiredString(entry.href, `${key}.href`) };
  });
}

function roles(value: unknown): CaseStudyRole[] {
  if (!Array.isArray(value)) throw new Error("Case study frontmatter requires roles to be a list.");
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Invalid roles entry.");
    const entry = item as Record<string, unknown>;
    return {
      label: requiredString(entry.label, "roles.label"),
      name: requiredString(entry.name, "roles.name"),
      description: requiredString(entry.description, "roles.description"),
      href: optionalString(entry.href),
    };
  });
}

function facts(value: unknown): CaseStudyFact[] {
  if (!Array.isArray(value)) throw new Error("Case study frontmatter requires facts to be a list.");
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Invalid facts entry.");
    const entry = item as Record<string, unknown>;
    return { label: requiredString(entry.label, "facts.label"), value: requiredString(entry.value, "facts.value") };
  });
}

function parseCaseStudy(slug: string, file: string): CaseStudy {
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const data = parsed.data as Record<string, unknown>;
  const parsedSlug = requiredString(data.slug, "slug");
  if (parsedSlug !== slug) throw new Error(`Case study slug mismatch in ${file}.`);
  const ctas = links(data.ctas, "ctas");
  if (!ctas.length) throw new Error(`Case study ${slug} requires at least one CTA.`);

  return {
    slug: parsedSlug,
    title: requiredString(data.title, "title"),
    description: requiredString(data.description, "description"),
    lede: requiredString(data.lede, "lede"),
    year: requiredString(data.year, "year"),
    client: requiredString(data.client, "client"),
    category: requiredString(data.category, "category"),
    canonicalUrl: requiredString(data.canonicalUrl, "canonicalUrl"),
    heroImage: optionalString(data.heroImage),
    heroImageAlt: optionalString(data.heroImageAlt),
    primaryCta: ctas[0],
    secondaryCta: ctas[1],
    facts: facts(data.facts),
    roles: roles(data.roles),
    markdown: parsed.content.trim(),
  };
}

export function getCaseStudySlugs(): string[] {
  return fs.readdirSync(contentDirectory).filter((file) => file.endsWith(".md")).map((file) => file.replace(/\.md$/, ""));
}

export function getCaseStudy(slug: string): CaseStudy {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Invalid case study slug.");
  return parseCaseStudy(slug, path.join(contentDirectory, `${slug}.md`));
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified().use(remarkParse).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify).process(markdown);
  return String(file);
}
