# Case studies

Case-study pages are generated from Markdown files in `content/case-studies/`. Add a new file named after its URL slug, then add the same slug to the corresponding route automatically through `generateStaticParams`.

Each file requires YAML frontmatter for `slug`, `title`, `description`, `lede`, `year`, `client`, `category`, `canonicalUrl`, `ctas`, `facts`, and `roles`. `articleUrl`, `heroImage`, and `heroImageAlt` are optional. When present, `articleUrl` renders a link to the published Algolia article. The body is sanitized Markdown; start it at `##` because the template supplies the page’s `h1`.
