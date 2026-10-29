# Blog Post Ideas page setup

The `/blog-post-ideas` page is a shared spreadsheet backed by the Blog Post Ideas Notion database. It uses a server-side Conduit bridge, so the Notion token stays in Conduit's encrypted connection store.

## Required deployment values

Set these values in the Authors Collective website deployment:

- `BLOG_IDEAS_ACCESS_PASSWORD`: the shared password participants enter; use at least 32 characters.
- `BLOG_IDEAS_SESSION_SECRET`: a separate random value of at least 32 characters.
- `BLOG_IDEAS_CONDUIT_API_URL`: the Conduit origin, without an API path.

Set the same `BLOG_IDEAS_ACCESS_PASSWORD` and `BLOG_IDEAS_SESSION_SECRET` in Conduit. Generate each with `openssl rand -base64 32`; store values in the deployment secret stores and do not commit or paste them into chat. The website fails closed until all three values are configured.

Conduit also requires its existing `CONDUIT_MCP_TENANT_ID`, `CONNECTION_SECRET_ENCRYPTION_KEY`, and an active `Notion · Authors Collective` connection. The Notion integration needs access to the Blog Post Ideas database; if its credential has a `dataSourceIds` allowlist, add the public data-source ID. The bridge checks this and scopes all row mutations to the one database.

## Identity and access

Every participant who knows the shared password can view and edit every row. They enter a display name when signing in; that self-entered name is attached to rows they create and cannot be changed while editing the row. The shared-password model does not verify each person's real-world identity. The name is a collaboration label, not an account identity.

Rows save directly to Notion. Deleting a row moves it to Notion trash. The existing Notion-person properties remain available in Notion, while the website uses the text fields for SME and entered creator names.
