import { category, calculate, csv } from "./model.mjs";
const $ = (s) => document.querySelector(s),
    esc = (s) =>
        String(s ?? "").replace(
            /[&<>"']/g,
            (c) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                })[c],
        );
const money = (n) =>
    new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 2,
    }).format(n);
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
let data,
    selected,
    page = 0,
    sheet = [],
    computed = null;
const pageSize = 8;
function inputs() {
    return Object.fromEntries(fields.map((k) => [k, $("#" + k).value]));
}
function renderLots() {
    const q = $("#search").value.toLowerCase().trim(),
        sale = $("#sale").value,
        cat = $("#category").value,
        sort = $("#sort").value;
    const lots = data.lots.filter(
        (l) =>
            (!q || l.title.toLowerCase().includes(q) || l.number === q) &&
            (!sale || l.sale === sale) &&
            (!cat || category(l.title) === cat),
    );
    lots.sort(
        sort === "high"
            ? (a, b) => (b.hammer ?? -1) - (a.hammer ?? -1)
            : sort === "low"
              ? (a, b) => (a.hammer ?? Infinity) - (b.hammer ?? Infinity)
              : (a, b) => Number(a.number) - Number(b.number),
    );
    page = Math.min(page, Math.max(0, Math.ceil(lots.length / pageSize) - 1));
    const selectedVisible = selected && lots.slice(page * pageSize, (page + 1) * pageSize).some((lot) => lot.id === selected.id),
        selectedNote = selected && !selectedVisible
            ? `<p class="selection-note">selected lot is outside this view <button type="button" data-reveal-selected>show it</button></p>`
            : "";
    $("#lots").innerHTML =
        selectedNote +
        (lots
            .slice(page * pageSize, (page + 1) * pageSize)
            .map(
                (l) =>
                    `<button class="lot" data-id="${l.id}" aria-pressed="${selected?.id === l.id}"><span class="lot-no">${l.number}</span><span class="lot-title-text">${esc(l.title)}</span><span class="price">${l.hammer === null ? "unknown" : money(l.hammer)}</span></button>`,
            )
            .join("") || "<p>No lots match. Try a broader search.</p>");
    $("#count").textContent = `${lots.length} of ${data.lots.length} lots`;
    $("#page").textContent =
        `${lots.length ? page + 1 : 0} / ${Math.ceil(lots.length / pageSize)}`;
    $("#previous").disabled = page === 0;
    $("#next").disabled = (page + 1) * pageSize >= lots.length;
    window.__hardware = {
        ready: true,
        total: data.lots.length,
        filtered: lots.length,
        selected: selected?.id,
        saved: sheet.length,
        result: computed,
    };
}
function choose(lot) {
    selected = lot;
    const sale = data.sales[lot.sale];
    $("#lot-sale").textContent =
        `lot ${lot.number} / ${sale.location} / ${sale.date}`;
    $("#lot-title").textContent = lot.title;
    $("#lot-result").textContent = `${lot.hammer === null ? "Unknown" : money(lot.hammer)} observed hammer \u00b7 ${lot.bids ?? "unknown"} bids \u00b7 ${lot.closed ? "watcher marked closed" : "close unconfirmed"}`;
    $("#lot-source").href = lot.url;
    $("#premium").value = sale.premium;
    $("#vat").value = sale.vat;
    $("#hammer").value = lot.hammer ?? 0;
    const saved = sheet.find((x) => x.id === lot.id);
    if (saved) for (const k of fields) $("#" + k).value = saved.inputs[k];
    $("#saved-status").textContent = "";
    calculateNow();
    renderLots();
}
function calculateNow() {
    try {
        computed = calculate(inputs());
        $("#error").textContent = "";
        $("#result").hidden = false;
        $("#save").disabled = false;
        $("#maximum").textContent = money(
            Math.floor(computed.maxHammer * 100) / 100,
        );
        $("#verdict").textContent = computed.feasible
            ? `Ceiling for ${money(Number($("#profit").value))} expected profit.`
            : "Even a free hammer cannot meet this target under your assumptions.";
        $("#downside").textContent =
            `Working outcome: ${money(computed.workingProfit)} profit. Failed outcome: ${money(computed.failedProfit)}. At your test hammer.`;
        $("#trace-proceeds").textContent = money(computed.proceeds);
        $("#trace-acquisition").textContent = money(computed.acquisition);
        $("#trace-profit").textContent = money(computed.expectedProfit);
        $("#cash-trace").hidden = $("#downside").hidden = false;
    } catch (e) {
        computed = null;
        $("#error").textContent = e.message;
        $("#result").hidden = true;
        $("#save").disabled = true;
        $("#cash-trace").hidden = $("#downside").hidden = true;
        $("#trace-proceeds").textContent = "—";
        $("#trace-acquisition").textContent = "—";
        $("#trace-profit").textContent = "—";
    }
    if (window.__hardware) window.__hardware.result = computed;
}
function renderSheet() {
    $("#sheet-count").textContent = sheet.length;
    $("#export").disabled = !sheet.length;
    $("#sheet").innerHTML =
        sheet
            .map(
                (s) =>
                    `<div class="saved-lot"><button class="restore" data-restore="${s.id}" type="button">${esc(s.title)}<small>lot ${s.number} / ${esc(data.sales[s.sale].location)} / resale assumption ${money(Number(s.inputs.resale))}</small></button><strong>${money(Math.floor(calculate(s.inputs).maxHammer * 100) / 100)}<small>max hammer</small></strong><button data-remove="${s.id}" aria-label="Remove saved lot ${esc(s.number)}">Remove</button></div>`,
            )
            .join("") || "<p>Save a costed lot to start your bid sheet.</p>";
    try {
        localStorage.setItem("hardware-bid-sheet", JSON.stringify(sheet));
    } catch {
        $("#saved-status").textContent =
            "Storage unavailable. Export CSV to keep the sheet.";
    }
    if (window.__hardware) window.__hardware.saved = sheet.length;
}
$("#calculator").oninput = calculateNow;
$("#calculator").onsubmit = (e) => e.preventDefault();
for (const id of ["search", "sale", "category", "sort"])
    $("#" + id).addEventListener(id === "search" ? "input" : "change", () => {
        page = 0;
        renderLots();
    });
$("#lots").onclick = (e) => {
    const reveal = e.target.closest("[data-reveal-selected]");
    if (reveal && selected) {
        $("#search").value = "";
        $("#sale").value = "";
        $("#category").value = "";
        $("#sort").value = "lot";
        page = Math.floor([...data.lots].sort((a,b) => Number(a.number) - Number(b.number)).findIndex((lot) => lot.id === selected.id) / pageSize);
        renderLots();
        return;
    }
    const b = e.target.closest("[data-id]");
    if (b) {
        choose(data.lots.find((l) => l.id === b.dataset.id));
        if (matchMedia("(max-width: 850px)").matches)
            $("#bid-calculator").scrollIntoView({ block: "start" });
    }
};
$("#previous").onclick = () => {
    page--;
    renderLots();
};
$("#next").onclick = () => {
    page++;
    renderLots();
};
$("#save").onclick = () => {
    if (!computed || !selected) return;
    sheet = sheet.filter((x) => x.id !== selected.id);
    sheet.push({ ...selected, inputs: inputs() });
    renderSheet();
    $("#saved-status").textContent = "Saved to your bid sheet.";
};
$("#sheet").onclick = (e) => {
    const restore = e.target.closest("[data-restore]");
    if (restore) {
        choose(data.lots.find(lot => lot.id === restore.dataset.restore));
        $("#bid-calculator").scrollIntoView({block: "start"});
        $("#resale").focus({preventScroll: true});
        return;
    }
    const b = e.target.closest("[data-remove]");
    if (b) {
        sheet = sheet.filter((x) => x.id !== b.dataset.remove);
        renderSheet();
    }
};
$("#export").onclick = () => {
    const rows = sheet.map((s) => {
        const r = calculate(s.inputs);
        return {
            sale: data.sales[s.sale].name,
            lot: s.number,
            title: s.title,
            observed_hammer: s.hammer,
            resale_assumption: s.inputs.resale,
            failure_pct: s.inputs.failure,
            premium_pct: s.inputs.premium,
            vat_pct: s.inputs.vat,
            max_hammer: (Math.floor(r.maxHammer * 100) / 100).toFixed(2),
            expected_profit_at_observed:
                s.hammer === null
                    ? ""
                    : calculate({
                          ...s.inputs,
                          hammer: s.hammer,
                      }).expectedProfit.toFixed(2),
        };
    });
    const url = URL.createObjectURL(
        new Blob([csv(rows)], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "hardware-bid-sheet.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("#retry").onclick = () => location.reload();
try {
    const r = await fetch("data/lots.json");
    if (!r.ok) throw Error("Lot records could not load");
    data = await r.json();
    $("#sale").innerHTML += Object.entries(data.sales)
        .map(([id, s]) => `<option value="${id}">${esc(s.name)}</option>`)
        .join("");
    $("#category").innerHTML += [
        ...new Set(data.lots.map((l) => category(l.title))),
    ]
        .sort()
        .map((c) => `<option>${c}</option>`)
        .join("");
    try {
        const stored = JSON.parse(
            localStorage.getItem("hardware-bid-sheet") || "[]",
        );
        sheet = (Array.isArray(stored) ? stored : []).filter(
            (s) => data.lots.some((l) => l.id === s.id) && calculate(s.inputs),
        );
    } catch {
        sheet = [];
    }
    const initialLot =
        data.lots.find((lot) => /Zotac Gaming RTX 3070/i.test(lot.title)) ||
        data.lots.find((lot) => /RTX/i.test(lot.title)) ||
        data.lots[0];
    $("#search").value = "RTX";
    choose(initialLot);
    renderSheet();
} catch (e) {
    $("#count").textContent = "Lot records could not load. Retry below.";
    $("#lot-source").hidden = true;
    $("#retry").hidden = false;
    $("#lot-title").textContent = "Catalogue unavailable";
    $("#lot-result").textContent = "Retry loading the bundled records.";
    for (const control of document.querySelectorAll("input,select,#save,#export,#previous,#next")) control.disabled = true;
    $("#result").hidden = $("#cash-trace").hidden = $("#downside").hidden = true;
}
