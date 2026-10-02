# Hardware Hunt

The bid desk helps a hardware buyer work backwards from editable resale and failure assumptions to a maximum hammer bid. The catalogue contains 770 actual archived lots.

## Direction and references

The original public lot records supply catalogue titles, lot numbers and observed hammers. An auction docket supplies the desk layout: a numbered catalogue on the left, a selected lot and costed decision on the right. The inspected previous demo hid failure downside and gave historical hammers and example resale values almost the same visual treatment.

```
Hardware Hunt / archive dates
Search, sale, type, sort
Lot number / archived title / observed hammer | Archived selected lot
                                              | Maximum hammer
                                              | Editable assumptions
                                              | Cash trace + failure downside
Saved bid sheet / CSV
```

## Tokens

- Ground `#17191e`, catalogue `#1e222a`, calculator `#262932`, rule `#41434f`, text `#f1ece3`, secondary `#b2b0b9`, bid `#e4bd83`, risk `#e6a392`.
- Display: local Bahnschrift/Segoe UI, 36-44px. Body: local Segoe UI, 14-16px. Lot numbers/prices: local Consolas. No font download.
- 1160px width; catalogue and calculator have equal practical weight. 24px desk gutter, 44px input/control minimum height, 8px spacing base.
- Selected catalogue row has an amber edge and clear surface change. Archived facts use quiet labels; editable assumptions occupy a separate form. The maximum hammer is the largest monetary figure.
- Sale/type/sort sit above the catalogue so filtering is discoverable. Saved bids remain below the desk. Mobile stacks, scrolls to a selected lot's calculator and offers a back-to-lots link.

## Behaviour and acceptance

Preserve archive records, actual sale premiums, VAT basis, model equations, sample input defaults, saved sheet and CSV. No inferred appraisals or live bids. Show failure downside next to expected profit. Unknown hammers remain unknown. Source link opens with noopener. The ceiling still needs rounding down to the auction's valid increment.

Acceptance: 770 lots; filter/search/page/selection; assumption propagation; invalid failure input; actual sale fees; persistent save/delete/CSV; 1280px and 390px renders, keyboard focus, reduced motion, load failure and no normal JavaScript errors. Three bounded review passes: function, system, craft.

## Copy audit

Named emotions and generic benefits: none. Rejected: "find hidden gems", "maximise returns", "intelligent auction insights". Unknown condition and sale settlement remain explicit. Narrative sensory, personal-cost and irrelevant-detail quotas do not fit catalogue documentation; no detail or precision is fabricated.

## Completed review

Function, design-system and visual-craft passes completed at 1280px and 390px in isolated Chrome. Main controls, invalid inputs, visible focus and reduced motion were checked; screenshots were opened and inspected. The repository guide uses the actual implementation and names its data limits. Full audit records, state screenshots, copy audit and metadata proposals are kept in ignored `output/qa/`.
