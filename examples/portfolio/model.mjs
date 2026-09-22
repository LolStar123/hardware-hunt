export function category(title) {
    if (/RTX|GTX|Radeon|graphics|Quadro|GPU/i.test(title))
        return "graphics & workstations";
    if (/workstation|desktop|PC\b|Z[248]\b/i.test(title))
        return "graphics & workstations";
    if (/laptop|notebook|MacBook|ThinkPad/i.test(title)) return "laptops";
    if (/TV\b|television|display|monitor/i.test(title)) return "screens";
    if (/speaker|audio|sound|headphone|amplifier/i.test(title)) return "audio";
    return "other hardware";
}
export function calculate(input) {
    const fields = [
        "resale",
        "failure",
        "salvage",
        "selling",
        "transport",
        "repair",
        "profit",
        "premium",
        "vat",
        "hammer",
    ];
    const x = Object.fromEntries(fields.map((k) => [k, Number(input[k])]));
    if (
        fields.some(
            (k) =>
                input[k] === "" ||
                input[k] === null ||
                input[k] === undefined ||
                !Number.isFinite(x[k]) ||
                x[k] < 0,
        )
    )
        throw Error("Enter a non-negative number in every field.");
    if (["failure", "selling", "vat"].some((k) => x[k] > 100))
        throw Error("Failure, selling fee and VAT must be between 0 and 100%.");
    const multiplier = (1 + x.premium / 100) * (1 + x.vat / 100);
    const workingNet = x.resale * (1 - x.selling / 100),
        failedNet = x.salvage * (1 - x.selling / 100);
    const proceeds =
        workingNet * (1 - x.failure / 100) + (failedNet * x.failure) / 100;
    const fixed = x.transport + x.repair,
        available = proceeds - fixed - x.profit;
    const maxHammer = Math.max(0, available / multiplier);
    const premium = (x.hammer * x.premium) / 100,
        vat = ((x.hammer + premium) * x.vat) / 100;
    const acquisition = x.hammer + premium + vat + fixed;
    return {
        multiplier,
        proceeds,
        maxHammer,
        feasible: available >= 0,
        premium,
        vat,
        acquisition,
        expectedProfit: proceeds - acquisition,
        workingProfit: workingNet - acquisition,
        failedProfit: failedNet - acquisition,
    };
}
export function csv(rows) {
    const fields = [
        "sale",
        "lot",
        "title",
        "observed_hammer",
        "resale_assumption",
        "failure_pct",
        "premium_pct",
        "vat_pct",
        "max_hammer",
        "expected_profit_at_observed",
    ];
    const cell = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
    return [
        fields.join(","),
        ...rows.map((r) => fields.map((k) => cell(r[k])).join(",")),
    ].join("\n");
}
