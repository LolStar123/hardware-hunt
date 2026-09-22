import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculate, category, csv } from "./model.mjs";
const base = {
    resale: 600,
    failure: 20,
    salvage: 80,
    selling: 12,
    transport: 35,
    repair: 20,
    profit: 100,
    premium: 17.5,
    vat: 20,
    hammer: 100,
};
const data = JSON.parse(
    readFileSync(new URL("./data/lots.json", import.meta.url)),
);
test("actual lots contain only approved public fields", () => {
    assert.equal(data.lots.length, 770);
    for (const p of data.lots)
        assert.deepEqual(
            Object.keys(p).sort(),
            [
                "id",
                "sale",
                "number",
                "title",
                "hammer",
                "bids",
                "closed",
                "url",
            ].sort(),
        );
    assert.ok(
        data.lots.some((p) => category(p.title) === "graphics & workstations"),
    );
});
test("cash fees include VAT on premium and hammer", () => {
    const r = calculate(base);
    assert.ok(Math.abs(r.multiplier - 1.41) < 1e-12);
    assert.equal(r.premium, 17.5);
    assert.equal(r.vat, 23.5);
    assert.equal(r.acquisition, 196);
    assert.ok(Math.abs(r.proceeds - 436.48) < 1e-9);
    assert.ok(
        Math.abs(
            calculate({ ...base, hammer: r.maxHammer }).expectedProfit - 100,
        ) < 1e-9,
    );
    assert.equal(calculate({ ...base, premium: 25 }).multiplier, 1.5);
});
test("failure, impossible targets and invalid input", () => {
    assert.equal(calculate({ ...base, failure: 100 }).proceeds, 70.4);
    assert.equal(calculate({ ...base, resale: 0, salvage: 0 }).feasible, false);
    assert.equal(calculate({ ...base, resale: 0, salvage: 0 }).maxHammer, 0);
    for (const value of [-1, "", NaN, Infinity])
        assert.throws(() => calculate({ ...base, resale: value }));
    assert.throws(() => calculate({ ...base, failure: 101 }));
});
test("CSV quotes titles and includes missing prices as blanks", () => {
    const s = csv([{ title: '1 x 65" TV', observed_hammer: null }]);
    assert.match(s, /65"" TV/);
    assert.ok(s.includes("observed_hammer"));
});
