# the hardware hunt

Turns auction lots into fee-adjusted buying limits, using condition and resale evidence.

<!-- working-example:start -->
## Try it in a minute

**[Live example](https://lolstar123.github.io/hardware-hunt/)** · [Example code](examples/portfolio/model.mjs) · [Run locally](examples/portfolio/README.md) · [Atul's website](https://atul-kanodia-fieldnotes.atulswaggalicious.chatgpt.site)

Change fees and failure risk; calculate the maximum bid that preserves a target profit.

<img src="examples/portfolio/preview.png" alt="the hardware hunt example inputs and calculated output" width="760">

<!-- working-example:end -->

## The project

Track the lot, identify the hardware and estimate recoverable resale value. Include faults, buyer fees, VAT, transport and selling costs before setting a maximum hammer bid.

A cheap GPU stops being cheap surprisingly quickly.

## Find your way around

| Path | What is here |
| --- | --- |
| [examples/portfolio](examples/portfolio) | Runnable browser example and fixtures |
| [model.mjs](examples/portfolio/model.mjs) | Actual calculation or workflow |
| [model.test.mjs](examples/portfolio/model.test.mjs) | Reproducible checks and edge cases |
| [PROVENANCE.md](PROVENANCE.md) | How this example relates to the full project |
| [AGENTS.md](AGENTS.md) | Instructions for extending the example |

## Quick start

```sh
python -m http.server 8000 --directory examples/portfolio
node --test examples/portfolio/model.test.mjs
```

Open http://localhost:8000. No dependencies, accounts or API keys needed.

## What is included

Authored hardware lots and editable fee assumptions. No live bids, account data or private buying limits.
