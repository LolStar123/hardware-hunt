# the hardware hunt: working example

Change fees and failure risk; calculate the maximum bid that preserves a target profit.

**[Open the demo](https://lolstar123.github.io/hardware-hunt/)** · [Calculation / workflow code](model.mjs) · [Checks](model.test.mjs)

![Example output](preview.png)

## Run it

From the repository root, with Python 3 and Node.js 22:

```sh
python -m http.server 8000 --directory examples/portfolio
```

Open http://localhost:8000. Change an input, or edit the JSON fixture, then export the computed result as JSON or CSV.

```sh
node --test examples/portfolio/model.test.mjs
```

## What it does

Track the lot, identify the hardware and estimate recoverable resale value. Include faults, buyer fees, VAT, transport and selling costs before setting a maximum hammer bid.

## Scope and source

Authored hardware lots and editable fee assumptions. No live bids, account data or private buying limits.

poe/auctions/bidwatch.py, auction fee configuration and resale-floor workflow.

`model.mjs` is the small public implementation. `app.mjs` connects its inputs and outputs to the browser. No package install or network key is needed to run the example. GitHub Pages runs the same files after the checks pass.
