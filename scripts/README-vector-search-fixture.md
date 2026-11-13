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

By default, this uses `text-embedding-3-small` and writes:

```text
public/applets/v1/vector-search-embeddings.generated.json
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
  letter/number tokens, no stemming).
- Equal-weight reciprocal-rank fusion of the BM25 and vector rankings (`k=60`).
- Top-five results for every query, method, and requirements toggle state.

Hard-requirement rules are defined in `constraintFor()` in the generator.
Unknown charger port counts fail the strict charger filter because only verified
single-port products pass. Keep these rules aligned with the policy text and
product facts in the applet source when either changes.

## Import into the applet

The generated JSON is a build-time artifact, not a file the browser fetches.
Review its `embedding`, `ranking`, `products`, `queries`, and `states` fields.
Replace the corresponding placeholder result arrays in `EDITABLE_FIXTURE` in
`vector-search-revisited.js` with `states[queryId].off/on.{keyword,vector,hybrid}`.
Each generated row already uses the applet's `[productId, score, note]` shape.
Then update the fixture version, corpus date, and provenance to name the model,
model version, input-text recipe, and generation date. Keep the visible applet
disclosure accurate and say the data is measured only after importing a
generated fixture.

Re-run the generator whenever product text, query text, product attributes, or
the embedding model changes. Do not mix vectors from different models in one
comparison. The generated vectors are useful for reproducing the rankings but
are not needed by the applet after the result arrays have been imported.
