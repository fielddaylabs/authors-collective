---
slug: algolia-agent-evaluation-widget
title: Making agent evaluation easy to see
description: How Authors Collective and Field Day Labs turned a dense agent-evaluation outline into a small, inspectable article companion.
lede: One shopper question, five agent iterations, and a deliberately simple way to see what an average can hide.
year: "2026"
client: Algolia
category: Technical content + interactive demo
canonicalUrl: https://authorscollective.org/work/algolia-agent-evaluation-widget/
ctas:
  - label: Try the evaluation widget
    href: https://authorscollective.org/applets/v1/would-you-ship-preview.html
  - label: Read the Field Day Labs case study
    href: https://fieldday.dev/work/algolia-agent-evaluation-widget/
facts:
  - label: Client
    value: Algolia
  - label: Year
    value: "2026"
  - label: Format
    value: Article companion + interactive widget
  - label: Example
    value: One query, five agent iterations
roles:
  - label: Client
    name: Algolia
    href: https://www.algolia.com/
    description: The company and technical audience at the center of this educational example.
  - label: Editorial direction
    name: Authors Collective
    href: /
    description: The article framing and reader-focused explanation of how to evaluate agent changes.
  - label: Development partner
    name: Field Day Labs
    href: https://fieldday.dev/work/algolia-agent-evaluation-widget/
    description: The interactive widget, its fixed example data, and its article-ready embed.
---

## The editorial problem

Agent evaluation can quickly fill a page with scores, sample counts, confidence intervals, and case-by-case notes. That detail may be useful to an evaluation team, but it can leave a new reader unsure what to learn from it.

For the article *Stop shipping agents based on vibes*, we wanted the companion to teach one idea clearly: a single overall score can hide an important regression. The interaction needed to let readers see that for themselves instead of asking them to decode a dashboard.

## One question, five iterations

The widget holds the shopper’s question constant: “I need a waterproof jacket under 400g. Which one should I buy?” Readers can select five successive versions of the same fictional agent, open each iteration’s changes, and inspect the answer and its Relevance, Faithfulness, and Tone scores.

The central comparison uses two configurations with the same average score of 75. One scores 75 in each category. The other scores 98 in Relevance and Faithfulness, but 29 in Tone. Their averages match; their answers have very different tradeoffs.

The product catalog stays available in a closed-by-default disclosure. This gives the reader the facts needed to judge the answer without keeping another block of data on screen. After a reader selects the fifth iteration, a final section spells out the complete setup and the changes it keeps or removes.

## The reader takeaway

An average is a quick summary, not a verdict. Compare the categories and read the answer: a gain in factual accuracy can come with a worse tone, while a cautious agent can refuse even when the catalog has a good match.

The widget stays observational. It does not ask readers to approve a deployment or turn a score into a ship decision.

## A useful caveat

The catalog, configurations, answers, prices, and scores are fictional teaching data. The numbers are authored examples, not results from an Algolia customer, a live Agent Studio agent, or a production evaluation. The widget does not call a model or judge. It demonstrates how to inspect a change; it does not establish that a real agent improved.

## Keep exploring

[Try the evaluation widget](https://authorscollective.org/applets/v1/would-you-ship-preview.html) or read the [Field Day Labs case study](https://fieldday.dev/work/algolia-agent-evaluation-widget/) for the implementation details.
