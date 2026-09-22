# Working on the hardware hunt

Read PROVENANCE.md and examples/portfolio/README.md first.
Keep calculation and decision logic in model.mjs, independently runnable in Node.
Run `node --test examples/portfolio/model.test.mjs` after changes.
Keep generated fixtures labelled; never present sample outcomes as measured production results.
Preserve the project's workflow: Track the lot, identify the hardware and estimate recoverable resale value. Include faults, buyer fees, VAT, transport and selling costs before setting a maximum hammer bid.
Add regression checks for changed decisions, including missing or invalid inputs.
Do not add credentials, user records or runtime account integrations to the demo.
