# Hardware Hunt demo design

The bid desk starts with the decision that matters: how much can I bid without destroying the margin?

The catalogue uses 770 public historical liquidation lots. Selecting a lot loads its observed hammer, sale premium and VAT assumptions. The calculator works backwards from resale value, failure risk, salvage, fees, collection, repairs and target profit to a maximum hammer bid. Saved decisions persist and export as a bid sheet.

The visual language is an auction docket: dark paper, amber money figures, lot numbers and hard rules. The catalogue and calculator share one ruled surface so the page reads as a working desk rather than a shop or finance dashboard.

Rules:

- The maximum hammer is always the visual priority.
- Example resale and failure assumptions must remain editable and clearly distinct from historical facts.
- Public lot data never exposes private bidding limits or bidder identity.
- Filters and saved bids stay secondary until needed.
- Mobile moves from the lot list to the calculator without horizontal overflow.
