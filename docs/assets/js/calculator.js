// Fertilizer cost calculator. Turf pricing and math are carried over unchanged from the original
// TerraElementalCalc tool. The other application types (beds, crops, containers, potting media, trees)
// use the label rates Sigma AgriScience publishes for each product.

// Products, prices and rates come from src/data/pricing.json and src/data/products.json
// (loaded as window.TE_CALC by pricing-data.js), the same data used for the Pricing at a Glance PDF.
// A product with `ton: null` has rates but no published price yet; it shows "Contact for pricing".
const PRODUCTS = window.TE_CALC;
const BRIDGE_NOTE = "Due to fluctuating cost of inputs, Bridge products require custom pricing. Most recent prices used, pricing subject to change. Please inquire for current price.";

const BAG_LBS = 50;
const BAGS_PER_TON = 40;
const SQFT_PER_ACRE = 43560;
const GRAMS_PER_LB = 453.592;
const GAL_PER_CU_YD = 201.974;

const $ = (id) => document.getElementById(id);
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const num = (n, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const money = (n) => (n == null ? "—" : usd.format(n));

// Which products each application type can use, and the rate choices it offers.
const MODES = {
  turf: { has: (p) => p.rate != null },
  beds: { has: (p) => !!p.apps.beds },
  veg: { has: (p) => !!p.apps.veg },
  containers: { has: (p) => !!p.apps.containers },
  media: { has: (p) => !!p.apps.media },
  trees: { has: (p) => !!p.apps.tree },
};
const LEVELS = {
  beds: [["low", "Low", "Heavy soils"], ["med", "Medium", "Most plantings"], ["high", "High", "Light, sandy soils"]],
  veg: [["low", "Low", "Peas, beans"], ["med", "Medium", "Carrots, peppers, melons"], ["high", "High", "Onion, corn, potato, tomato"]],
  containers: [["low", "Low", ""], ["high", "High", ""]],
  media: [["low", "Low", "Heavy media"], ["med", "Medium", "Most nursery stock"], ["high", "High", "Light, porous media"]],
  trees: [["incorporation", "Mixed into hole", ""], ["broadcast", "Broadcast", ""]],
};
const HINTS = {
  beds: "Landscape bed rates by soil type: heavy soils (porosity under 60%) need less, light or sandy soils (over 80%) need more.",
  veg: "Incorporated before or at planting, per the product label. Some products use the same medium and high rate.",
  containers: "Label rate per container for each pot size.",
  media: "Mixed into potting media before planting. The rate depends on how porous the media is.",
  trees: "Applied at transplanting: mixed into the bottom of the planting hole, or broadcast around the tree.",
};

let mode = "turf";
let unit = "acres";
let mediaUnit = "yd";
let nLevel = 1;
const level = { beds: "med", veg: "med", containers: "low", media: "med", trees: "incorporation" };
let selected = 0;

// Product lbs per 1,000 sq ft for the selected nitrogen level.
const rateFor = (p) => p.rate * nLevel;

function calc(p, sqft, apps) {
  const bagPrice = p.ton / BAGS_PER_TON;
  const rate = rateFor(p);
  const lbs = rate * (sqft / 1000) * apps;
  const bagsExact = lbs / BAG_LBS;
  const bags = Math.ceil(bagsExact - 1e-9);
  const bagsPerAcre = (rate * SQFT_PER_ACRE / 1000) / BAG_LBS;
  return {
    bagPrice,
    lbs,
    bags,
    total: bags * bagPrice,
    perAcre: bagsPerAcre * bagPrice,
    perK: (rate / BAG_LBS) * bagPrice,
    bagsPerAcre,
  };
}

function inputs() {
  const val = (id, min = 0) => Math.max(min, parseFloat($(id).value) || 0);
  const area = val("area");
  return {
    area,
    sqft: unit === "acres" ? area * SQFT_PER_ACRE : area,
    apps: Math.max(1, Math.round(parseFloat($("apps").value) || 1)),
    gal: +$("pot-size").value,
    pots: Math.round(val("pot-count")),
    mediaQty: val("yards"),
    yards: mediaUnit === "yd" ? val("yards") : val("yards") / GAL_PER_CU_YD,
    trees: Math.round(val("tree-count")),
    caliper: val("caliper"),
  };
}

// Estimate for one product in the current mode. Cost fields are null when the product has no price.
function estimate(p, inp) {
  if (mode === "turf") {
    const c = calc(p, inp.sqft, inp.apps);
    return {
      ...c,
      rateText: `${num(rateFor(p), 2)} lb / 1,000 sq ft`,
      u1: ["Cost per acre", money(c.perAcre)],
      u2: ["Cost per 1,000 sq ft", money(c.perK)],
      unitCost: c.perAcre,
    };
  }
  const bagPrice = p.ton == null ? null : p.ton / BAGS_PER_TON;
  const costOf = (lbs) => (bagPrice == null ? null : (lbs / BAG_LBS) * bagPrice);
  const lv = level[mode];
  let lbs, rateText, u1, u2, unitCost;

  if (mode === "beds" || mode === "veg") {
    // beds: lb per 1,000 sq ft; veg: lb per acre
    const per1k = mode === "beds" ? p.apps.beds[lv] : (p.apps.veg[lv] * 1000) / SQFT_PER_ACRE;
    const apps = mode === "beds" ? inp.apps : 1;
    lbs = per1k * (inp.sqft / 1000) * apps;
    rateText = mode === "beds" ? `${num(per1k, 1)} lb / 1,000 sq ft` : `${num(p.apps.veg[lv])} lb / acre`;
    unitCost = costOf((per1k * SQFT_PER_ACRE) / 1000);
    u1 = ["Cost per acre", money(unitCost)];
    u2 = ["Cost per 1,000 sq ft", money(costOf(per1k))];
  } else if (mode === "containers") {
    const size = p.apps.containers.find((c) => c.gal === inp.gal) || p.apps.containers[0];
    const grams = size[lv];
    lbs = (grams * inp.pots * inp.apps) / GRAMS_PER_LB;
    rateText = `${num(grams)} g / ${size.gal}-gal pot`;
    unitCost = costOf(grams / GRAMS_PER_LB);
    u1 = ["Product per container", `${num(grams)} g (${num(grams / GRAMS_PER_LB, 2)} lb)`];
    u2 = ["Cost per container", money(unitCost)];
  } else if (mode === "media") {
    const perYd = p.apps.media[lv];
    lbs = perYd * inp.yards;
    rateText = `${num(perYd)} lb / cu yd`;
    unitCost = costOf(perYd);
    u1 = ["Product per cubic yard", `${num(perYd)} lb`];
    u2 = ["Cost per cubic yard", money(unitCost)];
  } else {
    const perInch = p.apps.tree[lv];
    const perTree = perInch * inp.caliper;
    lbs = perTree * inp.trees;
    rateText = `${num(perInch, 1)} lb / inch of trunk`;
    unitCost = costOf(perTree);
    u1 = ["Product per tree", `${num(perTree, 1)} lb`];
    u2 = ["Cost per tree", money(unitCost)];
  }
  const bags = Math.ceil(lbs / BAG_LBS - 1e-9);
  return { lbs, bags, bagPrice, total: bagPrice == null ? null : bags * bagPrice, rateText, u1, u2, unitCost };
}

const COLUMNS = {
  turf: ["Product", "Rate / 1,000 sq ft", "Bags / acre", "Cost / acre", "Cost / 1,000 sq ft", "Bags to order", "Total"],
  beds: ["Product", "Rate", "Product needed", "Bags to order", "Cost / acre", "Total"],
  veg: ["Product", "Rate", "Product needed", "Bags to order", "Cost / acre", "Total"],
  containers: ["Product", "Rate", "Product needed", "Bags to order", "Cost / container", "Total"],
  media: ["Product", "Rate", "Product needed", "Bags to order", "Cost / cu yd", "Total"],
  trees: ["Product", "Rate", "Product needed", "Bags to order", "Cost / tree", "Total"],
};

function rowCells(q, c) {
  if (mode === "turf") {
    return [q.bridge ? `${q.name} *` : q.name, `${num(rateFor(q), 2)} lbs`, num(c.bagsPerAcre, 2), usd.format(c.perAcre), usd.format(c.perK), num(c.bags), usd.format(c.total)];
  }
  const total = c.total == null ? "Contact for pricing" : usd.format(c.total);
  return [q.name, c.rateText, `${num(c.lbs, c.lbs < 10 ? 1 : 0)} lb`, num(c.bags), money(c.unitCost), total];
}

function projectText(inp) {
  const areaText = unit === "acres" ? `${num(inp.area, 2)} acres` : `${num(inp.area)} sq ft`;
  const lvName = mode === "turf" ? "" : LEVELS[mode].find(([k]) => k === level[mode])[1];
  switch (mode) {
    case "turf": return [`Application: Turf & lawns`, `Area: ${areaText}`, `Nitrogen rate: ${nLevel} lb N per 1,000 sq ft`, `Applications: ${inp.apps}`];
    case "beds": return [`Application: Garden & landscape beds`, `Area: ${areaText}`, `Rate: ${lvName}`, `Applications: ${inp.apps}`];
    case "veg": return [`Application: Vegetables & crops`, `Area: ${areaText}`, `Rate: ${lvName}`];
    case "containers": return [`Application: Containers & nursery`, `Containers: ${num(inp.pots)} × ${inp.gal}-gallon`, `Rate: ${lvName}`, `Applications: ${inp.apps}`];
    case "media": return [`Application: Potting media`, `Media: ${mediaText(inp)}`, `Rate: ${lvName}`];
    default: return [`Application: Trees & shrubs`, `Trees: ${num(inp.trees)} at ${num(inp.caliper, 1)}" average trunk diameter`, `Method: ${lvName}`];
  }
}

const mediaText = (inp) => (mediaUnit === "yd" ? `${num(inp.mediaQty, 2)} cubic yards` : `${num(inp.mediaQty)} gallons`);

function forWhat(inp) {
  switch (mode) {
    case "containers": return ` for ${num(inp.pots)} × ${inp.gal}-gallon containers${inp.apps > 1 ? `, ${inp.apps} applications` : ""}`;
    case "media": return ` for ${mediaText(inp)} of media`;
    case "trees": return ` for ${num(inp.trees)} tree${inp.trees === 1 ? "" : "s"}`;
    case "veg": return "";
    default: return inp.apps > 1 ? ` for ${inp.apps} applications` : "";
  }
}

function render() {
  const inp = inputs();
  const p = PRODUCTS[selected];
  const r = estimate(p, inp);

  $("area-hint").textContent = unit === "acres"
    ? `= ${num(inp.sqft)} sq ft`
    : `= ${num(inp.sqft / SQFT_PER_ACRE, 2)} acres`;
  $("media-hint").textContent = mediaUnit === "yd"
    ? `= ${num(inp.yards * GAL_PER_CU_YD)} gallons (1 cubic yard is about 202 gallons or 27 cubic feet)`
    : `= ${num(inp.yards, 2)} cubic yards (1 cubic yard is about 202 gallons)`;

  $("meta").innerHTML = "";
  const chips = mode === "turf"
    ? [`${num(rateFor(p), 2)} lbs / 1,000 sq ft`, `${num(rateFor(p) * SQFT_PER_ACRE / 1000)} lbs / acre`, p.group]
    : [r.rateText, p.group];
  chips.forEach((t) => {
    const s = document.createElement("span");
    s.className = "chip";
    s.textContent = t;
    $("meta").appendChild(s);
  });

  $("total").textContent = r.total == null ? "Contact for pricing" : usd.format(r.total);
  $("total").classList.toggle("!text-3xl", r.total == null);
  const tons = r.bags / BAGS_PER_TON;
  const needed = mode === "turf" ? "" : ` (${num(r.lbs, r.lbs < 10 ? 1 : 0)} lb needed)`;
  $("total-sub").textContent = `${num(r.bags)} bag${r.bags === 1 ? "" : "s"} (${num(tons, 2)} ton${tons === 1 ? "" : "s"}) of ${p.name.trim()}${forWhat(inp)}${needed}`;
  $("bags").textContent = num(r.bags);
  $("weight").textContent = `${num(r.bags * BAG_LBS)} lbs`;
  $("per-bag").textContent = money(r.bagPrice);
  $("per-ton").textContent = money(p.ton);
  $("u1-k").textContent = r.u1[0];
  $("u1").textContent = r.u1[1];
  $("u2-k").textContent = r.u2[0];
  $("u2").textContent = r.u2[1];
  $("bridge-note").classList.toggle("hidden", !(mode === "turf" && p.bridge));

  const link = $("product-link");
  link.href = p.slug ? `products/${p.slug}.html` : "products.html";
  link.textContent = p.slug ? "View product" : "View all products";

  const cols = COLUMNS[mode];
  const thClass = (j) => (j === 0 ? "py-2.5 pl-5 pr-3 text-left font-medium sm:pl-0" : j === cols.length - 1 ? "py-2.5 pl-3 pr-5 text-right font-medium sm:pr-0" : "px-3 py-2.5 text-right font-medium");
  $("cmp-head").innerHTML = `<tr class="border-b border-stone-200 text-xs text-stone-500">${cols.map((c, j) => `<th scope="col" class="${thClass(j)}">${c}</th>`).join("")}</tr>`;

  const tbody = $("cmp");
  tbody.innerHTML = "";
  let lastGroup = null;
  PRODUCTS.forEach((q, i) => {
    if (!MODES[mode].has(q)) return;
    if (q.group !== lastGroup) {
      lastGroup = q.group;
      const g = document.createElement("tr");
      g.innerHTML = `<td colspan="${cols.length}" class="pb-2 pl-5 pt-5 text-xs font-semibold uppercase tracking-wide text-field-700 sm:pl-0"></td>`;
      g.firstChild.textContent = q.group;
      tbody.appendChild(g);
    }
    const c = estimate(q, inp);
    const tr = document.createElement("tr");
    const sel = i === selected;
    tr.className = `cursor-pointer border-b border-stone-100 transition-colors ${sel ? "bg-field-50 font-semibold text-forest-950" : "hover:bg-stone-50"}`;
    tr.tabIndex = 0;
    tr.setAttribute("aria-selected", String(sel));
    const cells = rowCells(q, c);
    cells.forEach((t, j) => {
      const td = document.createElement("td");
      td.className = j === 0 ? "whitespace-nowrap py-2.5 pl-5 pr-3 text-left sm:pl-0" : j === cells.length - 1 ? "whitespace-nowrap py-2.5 pl-3 pr-5 text-right sm:pr-0" : "whitespace-nowrap px-3 py-2.5 text-right";
      td.textContent = t;
      tr.appendChild(td);
    });
    const choose = () => select(i);
    tr.addEventListener("click", choose);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
    tbody.appendChild(tr);
  });
  $("bridge-foot").classList.toggle("hidden", mode !== "turf");

  const estimateText = r.total == null ? "Contact for pricing" : usd.format(r.total) + (mode === "turf" && p.bridge ? " (Bridge product: please confirm current custom pricing)" : "");
  const body = `Hello Terra Elemental,\n\nI'd like a quote for:\n\nProduct: ${p.name.trim()}\n${projectText(inp).join("\n")}\nBags (50 lb): ${r.bags}\nCalculator estimate: ${estimateText}\n\nThank you.`;
  $("quote").href = `mailto:info@terraelemental.org?subject=${encodeURIComponent("Quote request: " + p.name.trim())}&body=${encodeURIComponent(body)}`;
}

// Selecting a Bridge product pops up the custom-pricing notice (once per selection, not on every re-render).
function select(i) {
  const changed = i !== selected;
  selected = i;
  $("product").value = i;
  render();
  if (changed && mode === "turf" && PRODUCTS[i].bridge) showBridgeNotice();
}

function showBridgeNotice() {
  const dlg = $("bridge-dialog");
  if (typeof dlg.showModal === "function") {
    if (!dlg.open) dlg.showModal();
  } else {
    alert(BRIDGE_NOTE);
  }
}

// Product menu lists only the products that have rates for the current application type.
function fillProducts() {
  const sel = $("product");
  sel.innerHTML = "";
  const groups = {};
  PRODUCTS.forEach((p, i) => {
    if (!MODES[mode].has(p)) return;
    if (!groups[p.group]) {
      groups[p.group] = document.createElement("optgroup");
      groups[p.group].label = p.group;
      sel.appendChild(groups[p.group]);
    }
    const o = document.createElement("option");
    o.value = i;
    o.textContent = p.ton == null ? `${p.name} (price on request)` : p.name;
    groups[p.group].appendChild(o);
  });
  if (!MODES[mode].has(PRODUCTS[selected])) selected = PRODUCTS.findIndex((p) => MODES[mode].has(p));
  sel.value = selected;
}

function fillLevels() {
  const seg = $("level-seg");
  seg.innerHTML = "";
  if (mode === "turf") return;
  const opts = LEVELS[mode];
  seg.className = `grid gap-1 rounded-lg bg-stone-100 p-1 grid-cols-${opts.length}`;
  $("level-label").textContent = mode === "trees" ? "Application method" : "Application rate";
  opts.forEach(([key, label, sub]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "rounded-md px-2 py-2.5 text-sm font-medium leading-tight text-stone-600 transition aria-pressed:bg-white aria-pressed:text-forest-950 aria-pressed:shadow-sm";
    b.setAttribute("aria-pressed", String(level[mode] === key));
    b.innerHTML = `<span class="block"></span>${sub ? '<span class="mt-0.5 block text-xs font-normal opacity-75"></span>' : ""}`;
    b.children[0].textContent = label;
    if (sub) b.children[1].textContent = sub;
    b.addEventListener("click", () => {
      level[mode] = key;
      seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
    seg.appendChild(b);
  });
  $("level-hint").textContent = HINTS[mode];
}

function setMode(next) {
  mode = next;
  document.querySelectorAll("#mode-seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  document.querySelectorAll("[data-show]").forEach((el) => el.classList.toggle("hidden", !el.dataset.show.split(" ").includes(mode)));
  fillProducts();
  fillLevels();
  render();
}

function init() {
  document.querySelectorAll("[data-bridge-text]").forEach((el) => { el.textContent = BRIDGE_NOTE; });
  $("bridge-dialog").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  // Container sizes offered by any product's label (1 to 15 gallons).
  const sizes = [...new Set(PRODUCTS.flatMap((p) => (p.apps.containers || []).map((c) => c.gal)))].sort((a, b) => a - b);
  $("pot-size").innerHTML = sizes.map((g) => `<option value="${g}">${g} gallon</option>`).join("");

  // Preselect from ?mode=<type>&product=<slug> (linked from product pages).
  const params = new URLSearchParams(location.search);
  const wantedMode = params.get("mode");
  const startMode = MODES[wantedMode] ? wantedMode : "turf";
  const idx = PRODUCTS.findIndex((p) => p.slug && p.slug === params.get("product") && MODES[startMode].has(p));
  if (idx >= 0) selected = idx;

  $("product").addEventListener("change", () => select(+$("product").value));
  ["area", "apps", "pot-size", "pot-count", "yards", "tree-count", "caliper"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });

  document.querySelectorAll("#mode-seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  document.querySelectorAll("#n-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      nLevel = +b.dataset.n;
      document.querySelectorAll("#n-seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
  });

  document.querySelectorAll("#unit-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.unit === unit) return;
      const { area } = inputs();
      // Convert the current value so the area stays the same when switching units.
      const next = b.dataset.unit;
      $("area").value = next === "sqft" ? Math.round(area * SQFT_PER_ACRE) : +(area / SQFT_PER_ACRE).toFixed(3);
      unit = next;
      document.querySelectorAll("#unit-seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
  });

  document.querySelectorAll("#media-unit-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.unit === mediaUnit) return;
      // Convert the current value so the amount of media stays the same when switching units.
      const { yards } = inputs();
      mediaUnit = b.dataset.unit;
      $("yards").value = mediaUnit === "gal" ? +(yards * GAL_PER_CU_YD).toFixed(1) : +yards.toFixed(3);
      document.querySelectorAll("#media-unit-seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
  });

  setMode(startMode);
  if (mode === "turf" && PRODUCTS[selected].bridge) showBridgeNotice();
}

init();
