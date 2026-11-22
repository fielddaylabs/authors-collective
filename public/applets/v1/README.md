# Article applets

Both applets are classic scripts with a Shadow DOM mount. No runtime API, credentials, cookies, or storage are used. Keep fallback text inside each mount; each mount owns independent state.

## Adaptive Intent

```html
<div data-ac-applet="adaptive-intent"><p>Interactive synthetic centroid example loading.</p></div>
<script defer src="https://authorscollective.org/applets/v1/adaptive-intent.js"></script>
```

A script in `<head>` can instead set `data-target="#article-anchor"`; the selector must be explicit. Never infer placement from heading text.

## Would you ship this change?

The generated fixture must load before the applet. Means and seeded paired-bootstrap intervals are precomputed; the browser does not sample them.

```html
<div data-ac-applet="would-you-ship"><p>Interactive synthetic evaluation example loading.</p></div>
<script defer src="https://authorscollective.org/applets/v1/would-you-ship-fixture.js"></script>
<script defer src="https://authorscollective.org/applets/v1/would-you-ship.js"></script>
```

Run `node scripts/generate-would-you-ship-fixture.mjs` after changing score inputs or interval methodology; commit JSON and browser JS together. JSON includes synthetic paired scores, means, interval bounds, seed, and sample count.

## Preview and verification

Use `adaptive-intent-preview.html`, `would-you-ship-preview.html`, or `preview.html` via a static HTTP server. Check at 320px and desktop widths, keyboard use, disclosure state through updates, repeated/delayed scripts, multiple mounts, and loading from a different localhost origin. No network requests occur after loading.

All scores, vectors, events, thresholds, rationales, and answers are synthetic. Neither applet reproduces Algolia production behavior.
