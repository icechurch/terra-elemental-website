// Fertilizer cost calculator. Pricing and math are carried over unchanged from the original
// TerraElementalCalc tool; only the markup/styling moved into the site layout.

// Prices and rates come from src/data/pricing.json (loaded as window.TE_PRICING by pricing-data.js),
// the same data used for the Pricing at a Glance PDF.
const PRODUCTS = window.TE_PRICING.products;
const BRIDGE_NOTE = "Due to fluctuating cost of inputs, Bridge products require custom pricing. Most recent prices used, pricing subject to change. Please inquire for current price.";

const BAG_LBS = 50;
const BAGS_PER_TON = 40;
const SQFT_PER_ACRE = 43560;

const $ = (id) => document.getElementById(id);
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const num = (n, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });

let unit = "acres";
let nLevel = 1;
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

// Selecting a Bridge product pops up the custom-pricing notice (once per selection, not on every re-render).
function select(i) {
  const changed = i !== selected;
  selected = i;
  $("product").value = i;
  render();
  if (changed && PRODUCTS[i].bridge) showBridgeNotice();
}

function showBridgeNotice() {
  const dlg = $("bridge-dialog");
  if (typeof dlg.showModal === "function") {
    if (!dlg.open) dlg.showModal();
  } else {
    alert(BRIDGE_NOTE);
  }
}

function inputs() {
  const area = Math.max(0, parseFloat($("area").value) || 0);
  const apps = Math.max(1, Math.round(parseFloat($("apps").value) || 1));
  const sqft = unit === "acres" ? area * SQFT_PER_ACRE : area;
  return { area, apps, sqft };
}

function render() {
  const { area, apps, sqft } = inputs();
  const p = PRODUCTS[selected];
  const r = calc(p, sqft, apps);

  $("area-hint").textContent = unit === "acres"
    ? `= ${num(sqft)} sq ft`
    : `= ${num(sqft / SQFT_PER_ACRE, 2)} acres`;

  $("meta").innerHTML = "";
  [`${num(rateFor(p), 2)} lbs / 1,000 sq ft`, `${num(rateFor(p) * SQFT_PER_ACRE / 1000)} lbs / acre`, p.group].forEach((t) => {
    const s = document.createElement("span");
    s.className = "chip";
    s.textContent = t;
    $("meta").appendChild(s);
  });

  $("total").textContent = usd.format(r.total);
  const tons = r.bags / BAGS_PER_TON;
  $("total-sub").textContent = `${num(r.bags)} bags (${num(tons, 2)} ton${tons === 1 ? "" : "s"}) of ${p.name.trim()}` +
    (apps > 1 ? ` for ${apps} applications` : "");
  $("bags").textContent = num(r.bags);
  $("weight").textContent = `${num(r.bags * BAG_LBS)} lbs`;
  $("per-bag").textContent = usd.format(r.bagPrice);
  $("per-ton").textContent = usd.format(p.ton);
  $("per-acre").textContent = usd.format(r.perAcre);
  $("per-k").textContent = usd.format(r.perK);
  $("bridge-note").classList.toggle("hidden", !p.bridge);

  const link = $("product-link");
  link.href = p.slug ? `products/${p.slug}.html` : "products.html";
  link.textContent = p.slug ? "View product" : "View all products";

  const tbody = $("cmp");
  tbody.innerHTML = "";
  let lastGroup = null;
  PRODUCTS.forEach((q, i) => {
    if (q.group !== lastGroup) {
      lastGroup = q.group;
      const g = document.createElement("tr");
      g.innerHTML = `<td colspan="7" class="pb-2 pl-5 pt-5 text-xs font-semibold uppercase tracking-wide text-field-700 sm:pl-0"></td>`;
      g.firstChild.textContent = q.group;
      tbody.appendChild(g);
    }
    const c = calc(q, sqft, apps);
    const tr = document.createElement("tr");
    const sel = i === selected;
    tr.className = `cursor-pointer border-b border-stone-100 transition-colors ${sel ? "bg-field-50 font-semibold text-forest-950" : "hover:bg-stone-50"}`;
    tr.tabIndex = 0;
    tr.setAttribute("aria-selected", String(sel));
    const cells = [q.bridge ? `${q.name} *` : q.name, `${num(rateFor(q), 2)} lbs`, num(c.bagsPerAcre, 2), usd.format(c.perAcre), usd.format(c.perK), num(c.bags), usd.format(c.total)];
    cells.forEach((t, j) => {
      const td = document.createElement("td");
      td.className = j === 0 ? "whitespace-nowrap py-2.5 pl-5 pr-3 text-left sm:pl-0" : j === 6 ? "whitespace-nowrap py-2.5 pl-3 pr-5 text-right sm:pr-0" : "whitespace-nowrap px-3 py-2.5 text-right";
      td.textContent = t;
      tr.appendChild(td);
    });
    const choose = () => select(i);
    tr.addEventListener("click", choose);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
    tbody.appendChild(tr);
  });

  const areaText = unit === "acres" ? `${num(area, 2)} acres` : `${num(area)} sq ft`;
  const body = `Hello Terra Elemental,\n\nI'd like a quote for:\n\nProduct: ${p.name.trim()}\nArea: ${areaText}\nNitrogen rate: ${nLevel} lb N per 1,000 sq ft\nApplications: ${apps}\nBags (50 lb): ${r.bags}\nCalculator estimate: ${usd.format(r.total)}${p.bridge ? " (Bridge product: please confirm current custom pricing)" : ""}\n\nThank you.`;
  $("quote").href = `mailto:info@terraelemental.org?subject=${encodeURIComponent("Quote request: " + p.name.trim())}&body=${encodeURIComponent(body)}`;
}

function init() {
  document.querySelectorAll("[data-bridge-text]").forEach((el) => { el.textContent = BRIDGE_NOTE; });
  $("bridge-dialog").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  const sel = $("product");
  const groups = {};
  PRODUCTS.forEach((p, i) => {
    if (!groups[p.group]) {
      groups[p.group] = document.createElement("optgroup");
      groups[p.group].label = p.group;
      sel.appendChild(groups[p.group]);
    }
    const o = document.createElement("option");
    o.value = i;
    o.textContent = p.name;
    groups[p.group].appendChild(o);
  });

  // Preselect from ?product=<slug> (linked from product pages).
  const wanted = new URLSearchParams(location.search).get("product");
  const idx = PRODUCTS.findIndex((p) => p.slug && p.slug === wanted);
  if (idx >= 0) { selected = idx; sel.value = idx; }
  if (PRODUCTS[selected].bridge) showBridgeNotice();

  sel.addEventListener("change", () => select(+sel.value));
  $("area").addEventListener("input", render);
  $("apps").addEventListener("input", render);

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
  render();
}

init();
