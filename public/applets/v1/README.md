# Article applets

Both applets are classic scripts with a Shadow DOM mount. No runtime API, credentials, cookies, or storage are used. Keep fallback text inside each mount; each mount owns independent state.

## Adaptive Intent

```html
<div data-ac-applet="adaptive-intent"><p>Interactive synthetic centroid example loading.</p></div>
<script defer src="https://authorscollective.org/applets/v1/adaptive-intent.js"></script>
```

A script in `<head>` can instead set `data-target="#article-anchor"`; the selector must be explicit. Never infer placement from heading text.

## Would you ship this change?

The generated fixture must load before the applet. It contains one fictional jacket query and five fictional agent iterations. Each option shows an average of Relevance, Faithfulness, and Tone. Iterations 2 and 3 both score 75 overall, while their category scores differ sharply. The collapsed product list includes illustrative catalog images and example prices from `images/would-you-ship-jackets.jpg`. Selecting iteration 5 reveals a final summary of its complete configuration; it remains visible for the rest of that page load. The browser does not call a model or evaluator.

```html
<div data-ac-applet="would-you-ship"><p>Interactive synthetic evaluation example loading.</p></div>
<script defer src="https://authorscollective.org/applets/v1/would-you-ship-fixture.js"></script>
<script defer src="https://authorscollective.org/applets/v1/would-you-ship.js"></script>
```

Run `node scripts/generate-would-you-ship-fixture.mjs` after changing the query, catalog facts, configurations, answers, scores, or rationales; commit JSON and browser JS together. All values and answers are synthetic teaching examples, not Agent Studio measurements. The total is intentionally a simple average to illustrate how an aggregate can hide a weak category; it is not a production quality score.

## Preview and verification

Use `adaptive-intent-preview.html`, `would-you-ship-preview.html`, or `preview.html` via a static HTTP server. Check at 320px and desktop widths, keyboard use, disclosure state through updates, repeated/delayed scripts, multiple mounts, and loading from a different localhost origin. No network requests occur after loading.

All scores, vectors, events, thresholds, rationales, and answers are synthetic. Neither applet reproduces Algolia production behavior.
