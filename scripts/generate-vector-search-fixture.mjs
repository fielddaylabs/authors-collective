#!/usr/bin/env node
/**
 * Generate a real, offline-to-the-browser vector-search fixture from the
 * editable product/query data in public/applets/v1/vector-search-revisited.js.
 *
 * The script sends product and query text to an OpenAI-compatible embeddings
 * endpoint during authoring. The browser applet never calls this endpoint.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const DEFAULT_SOURCE = "public/applets/v1/vector-search-revisited.js";
const DEFAULT_OUTPUT = "data/vector-search-embeddings.generated.json";
const DEFAULT_MODEL = "text-embedding-3-small";
const RRF_K = 60;
const STOP_WORDS = new Set((
  "a an and are as at be been being but by can could did do does doing down during each for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves"
).split(/\s+/));

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function tokenize(text) {
  return (String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((token) => !STOP_WORDS.has(token));
}

function productText(product) {
  return [product.name, product.brand, product.kind, product.desc, product.facts]
    .filter(Boolean)
    .join(". ");
}

function extractFixture(source) {
  const match = source.match(/var EDITABLE_FIXTURE=(\{[\s\S]*?\n  \});\n  var css=/);
  if (!match) throw new Error("Could not find EDITABLE_FIXTURE in the applet source.");
  return vm.runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 1000 });
}

function constraintFor(query) {
  // Keep these filters aligned with the policy text in the applet fixture.
  switch (query.id) {
    case "adidas":
      return (p) => p.brand.toLowerCase() === "adidas" && p.kind === "running shoe";
    case "comfort":
      return () => true;
    case "charger":
      return (p) => p.ports === 1 && p.usbC === true && Number(p.watts) >= 65;
    case "pegasus":
      return (p) => p.id === "nike-pegasus-41";
    default:
      throw new Error(`No hard-requirement rule is defined for query: ${query.id}`);
  }
}

function bm25(documents, queryTokens) {
  const tokenized = documents.map((doc) => tokenize(doc));
  const lengths = tokenized.map((tokens) => tokens.length);
  const averageLength = lengths.reduce((sum, length) => sum + length, 0) / (lengths.length || 1);
  const frequencies = tokenized.map((tokens) => {
    const counts = new Map();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    return counts;
  });
  const documentFrequency = new Map();
  for (const term of new Set(queryTokens)) {
    documentFrequency.set(term, frequencies.reduce((count, counts) => count + (counts.has(term) ? 1 : 0), 0));
  }

  const k1 = 1.2;
  const b = 0.75;
  return frequencies.map((counts, index) => {
    let score = 0;
    for (const term of new Set(queryTokens)) {
      const tf = counts.get(term) ?? 0;
      if (!tf) continue;
      const df = documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (tokenized.length - df + 0.5) / (df + 0.5));
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * lengths[index] / (averageLength || 1))));
    }
    return score;
  });
}

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function orderByScore(products, scores) {
  return products
    .map((product, index) => ({ product, score: scores[index] }))
    .sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id));
}

async function embed(texts, { apiKey, baseUrl, model, batchSize, dimensions }) {
  const vectors = new Array(texts.length);
  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const body = { model, input: batch };
    if (dimensions) body.dimensions = dimensions;
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Embedding request failed (${response.status}): ${message}`);
    }
    const payload = await response.json();
    for (const item of payload.data ?? []) vectors[start + item.index] = item.embedding;
    if (batch.some((_, index) => !vectors[start + index])) {
      throw new Error("Embedding response omitted one or more input vectors.");
    }
  }
  return vectors;
}

function createStates(fixture, productVectors, queryVectors) {
  const states = {};
  fixture.queries.forEach((query, queryIndex) => {
    const queryStates = {};
    for (const constrained of [false, true]) {
      const candidates = fixture.products
        .map((product, index) => ({ product, index }))
        .filter(({ product }) => !constrained || constraintFor(query)(product));
      const candidateProducts = candidates.map(({ product }) => product);
      const keywordScores = bm25(candidateProducts.map(productText), tokenize(query.text));
      const vectorScores = candidates.map(({ index }) => cosine(queryVectors[queryIndex], productVectors[index]));
      const keywordOrder = orderByScore(candidateProducts, keywordScores).filter(({ score }) => score > 0);
      const vectorOrder = orderByScore(candidateProducts, vectorScores);
      const keywordRanks = new Map(keywordOrder.map((item, index) => [item.product.id, index + 1]));
      const vectorRanks = new Map(vectorOrder.map((item, index) => [item.product.id, index + 1]));
      const hybridScores = candidateProducts.map((product) =>
        (keywordRanks.has(product.id) ? 1 / (RRF_K + keywordRanks.get(product.id)) : 0)
        + 1 / (RRF_K + vectorRanks.get(product.id)));
      const hybridOrder = orderByScore(candidateProducts, hybridScores);
      const key = constrained ? "on" : "off";
      queryStates[key] = {
        keyword: keywordOrder.slice(0, 5).map(({ product, score }) => [product.id, score, "BM25 lexical match"]),
        vector: vectorOrder.slice(0, 5).map(({ product, score }) => [product.id, score, "Cosine similarity"]),
        hybrid: hybridOrder.slice(0, 5).map(({ product, score }) => [product.id, score, "RRF of BM25 and cosine ranks"]),
      };
    }
    states[query.id] = queryStates;
  });
  return states;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY before generating embeddings.");
  const sourcePath = resolve(arg("source", DEFAULT_SOURCE));
  const outputPath = resolve(arg("output", DEFAULT_OUTPUT));
  const model = arg("model", DEFAULT_MODEL);
  const baseUrl = arg("base-url", process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1");
  const batchSize = Number(arg("batch-size", "64"));
  const dimensionsArg = arg("dimensions", "");
  const dimensions = dimensionsArg ? Number(dimensionsArg) : undefined;
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("--batch-size must be a positive integer.");
  if (dimensions !== undefined && (!Number.isInteger(dimensions) || dimensions < 1)) {
    throw new Error("--dimensions must be a positive integer.");
  }

  const source = await readFile(sourcePath, "utf8");
  const fixture = extractFixture(source);
  const productTexts = fixture.products.map(productText);
  const queryTexts = fixture.queries.map((query) => query.text);
  const allVectors = await embed([...productTexts, ...queryTexts], {
    apiKey, baseUrl, model, batchSize, dimensions,
  });
  const productVectors = allVectors.slice(0, productTexts.length);
  const queryVectors = allVectors.slice(productTexts.length);
  const generatedAt = new Date().toISOString();
  const output = {
    format: "authors-collective-vector-search-fixture/v1",
    generatedAt,
    corpusDate: fixture.corpusDate,
    sourceFixtureVersion: fixture.version,
    embedding: {
      provider: new URL(baseUrl).host,
      model,
      dimensions: productVectors[0]?.length ?? dimensions ?? null,
      inputTemplate: "name + brand + kind + desc + facts, joined with '. '",
    },
    ranking: {
      bm25: { k1: 1.2, b: 0.75, tokenizer: "lowercase Unicode letters/numbers; common English stop words removed; no stemming; zero-score documents excluded" },
      vector: "cosine similarity; descending",
      hybrid: { method: "equal-weight reciprocal-rank fusion", k: RRF_K },
      tieBreak: "product ID ascending",
      limit: 5,
      constraintPolicy: "strict states filter candidates before ranking; unknown required attributes fail",
    },
    products: fixture.products.map((product, index) => ({
      id: product.id,
      text: productTexts[index],
      embedding: productVectors[index],
    })),
    queries: fixture.queries.map((query, index) => ({
      id: query.id,
      text: query.text,
      embedding: queryVectors[index],
    })),
    states: createStates(fixture, productVectors, queryVectors),
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${fixture.products.length} product vectors and ${fixture.queries.length} query vectors to ${outputPath}`);
  console.log("The generated states contain 24 precomputed result lists for manual import into the applet.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
