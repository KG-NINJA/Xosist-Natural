# Query planning and synthesis usage guide

Read only when using the query-planning/supplied-post workflow. Repository development authority, payment/collection approval and secret-handling rules remain in the root instructions.

[AGENTS.md](../AGENTS.md) governs authorization, stopping, scope and current
verification commands. This reference adds no authority.

# AGENTS.md — Xosist-Natural

## Purpose

Help an AI agent turn a research intent into multiple high-quality X advanced search queries, then turn user-supplied posts into a natural-language summary.

This project does **not** scrape X and does **not** call the official X API for search.

## Recommended flow for agents

1. Call `composeQueries(intent, { noiseLevel })` to get multi-angle queries.
2. Present the official search URLs to the human operator (or open them if the runtime allows).
3. Receive collected post texts from the human (or from a trusted collection step).
4. Call `synthesize(posts, intent, { style: 'report' })` or `buildSynthesisPrompt(...)` for external LLM synthesis.

## Key modules

- `lib/query-composer.js` → `composeQueries`
- `lib/synthesizer.js` → `synthesize`, `buildSynthesisPrompt`
- `lib/noise.js` → noise exclusion lists

## Rules

- Never request private keys or wallet secrets.
- Prefer free client-side / offline planning.
- If automated collection is added later, gate it behind explicit payment (x402) and human approval.
