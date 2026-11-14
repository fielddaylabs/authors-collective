# Generate the vector-search applet fixture

`generate-vector-search-fixture.mjs` runs during content preparation, not in the
browser. It reads the editable product records and query text from
`public/applets/v1/vector-search-revisited.js`, sends those strings to an
OpenAI-compatible embeddings endpoint, computes the result lists, and writes a
JSON artifact containing the input text, embeddings, ranking metadata, and all
24 query/method/requirements states. The applet itself makes no API requests.

## Generate with the OpenAI API

Use Node.js 18 or newer. Set an API key in your shell, then run:

```sh
export OPENAI_API_KEY="..."
node scripts/generate-vector-search-fixture.mjs
```

By default, this uses `text-embedding-3-small` and writes the vector artifact
outside the public web root:

```text
data/vector-search-embeddings.generated.json
```

To choose another embeddings model, output path, or compatible endpoint:

```sh
OPENAI_API_KEY="..." node scripts/generate-vector-search-fixture.mjs \
  --model text-embedding-3-small \
  --output /tmp/vector-search-fixture.json
```

Supported options are `--source`, `--output`, `--model`, `--base-url`,
`--batch-size`, and `--dimensions`. `OPENAI_BASE_URL` can set the endpoint base
instead of `--base-url`. The endpoint must implement the OpenAI embeddings API
shape. The script uses Node's built-in `fetch`; it adds no app or client bundle
dependency.

## What the generator computes

- Embeddings for each product's exact `name + brand + kind + desc + facts` text
  and for each query's exact text.
- Cosine similarity, with ties broken by ascending product ID.
- A transparent BM25 baseline (`k1=1.2`, `b=0.75`; lowercase Unicode
  letter/number tokens, common English stop words removed, no stemming). Terms
  with zero BM25 score are excluded from lexical top-five results and receive no
  BM25 contribution in reciprocal-rank fusion.
- Equal-weight reciprocal-rank fusion of the BM25 and vector rankings (`k=60`).
- Top-five results for every query, method, and requirements toggle state.

Hard-requirement rules are defined in `constraintFor()` in the generator.
Unknown charger port counts fail the strict charger filter because only verified
single-port products pass. Keep these rules aligned with the policy text and
product facts in the applet source when either changes.

## Import into the applet

The generated JSON is a build-time artifact, not a file the browser fetches.
Review its `embedding`, `ranking`, `products`, `queries`, and `states` fields.
Import `states[queryId].off/on.{keyword,vector,hybrid}` into the matching query
in `EDITABLE_FIXTURE` in `vector-search-revisited.js`. Each generated row uses
the applet's `[productId, score, note]` shape. Update fixture version, corpus
date, and provenance with the model, dimensions, input-text recipe, and
generation date. The applet bundles only ranked rows: the browser must not load
the JSON, vectors, or call an embedding model. Its visible disclosure should
identify the embedding model and explain that ranking was computed offline.

Re-run the generator whenever product text, query text, product attributes, or
the embedding model changes. Do not mix vectors from different models in one
comparison. The generated vectors are useful for reproducing the rankings but
are not needed by the applet after the result arrays have been imported. Keep
the artifact in `data/`, outside `public/`, so it is not served as a public asset.
