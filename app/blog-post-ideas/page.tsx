import type { Metadata } from "next";
import BlogPostIdeasClient from "./blog-post-ideas-client";
import "./blog-post-ideas.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Blog Post Ideas | Authors Collective",
  description: "Shared Authors Collective blog post planning spreadsheet.",
  robots: { index: false, follow: false },
};

export default function BlogPostIdeasPage() {
  return <BlogPostIdeasClient />;
}
