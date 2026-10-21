// Generates every HTML page in docs/ from the shared layout below and src/data/products.json.
// Run with `npm run build` (this script, then Tailwind).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs");
const PRODUCTS = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/products.json"), "utf8"));
const PRICING = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/pricing.json"), "utf8"));
const PRICE_PDF = "assets/docs/terra-elemental-pricing.pdf";

const SITE = {
  name: "Terra Elemental",
  url: "https://terraelemental.org",
  email: "info@terraelemental.org",
  phone: "(813) 545-6993",
  phoneHref: "+18135456993",
  region: "San Luis Valley · Southern Colorado",
  // Web3Forms access key (https://web3forms.com). Submissions go to the email the key was created for.
  // While empty, the quote form falls back to opening a pre-filled email.
  formAccessKey: "687803a4-4b1c-4f3f-9028-0f1b7b712a54",
};

const LINES = [
  { id: "agriculture", label: "Large Grade", short: "Large Grade", blurb: "Large-granule organic biofertilizers for broadcast spreading, soil incorporation and dry blending." },
  { id: "specialty", label: "Fine Grade", short: "Fine Grade", blurb: "Micro-granular organic biofertilizers that spread evenly for consistent coverage." },
  { id: "bridge", label: "Bio Bridge · Turf Hybrid", short: "Bio Bridge", blurb: "High-performance turf blends: an organic base plus polymer-coated nitrogen for fast green-up and up to 10 weeks of steady feeding." },
  { id: "amendment", label: "Soil Amendment", short: "Silica", blurb: "Plant-available silicon from volcanic minerals to strengthen cell walls and plant resilience." },
];

const TEAM = [
  { name: "David Bonilla", role: "Co-Owner", photo: "assets/img/team/david-bonilla.jpg" },
  { name: "Keith Morrison", role: "Co-Owner", photo: "assets/img/team/keith-morrison.jpg" },
];

// ---------- helpers ----------
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const exists = (rel) => fs.existsSync(path.join(OUT, rel));
const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
// Keep N-P-K ratios like "15-5-10" from wrapping across lines.
const nameHtml = (n) => esc(n).replace(/\d+-\d+-\d+/g, (m) => `<span class="whitespace-nowrap">${m}</span>`);
const initials = (n) => n.split(" ").map((w) => w[0]).join("");

const ICONS = {
  arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  root: '<path d="M12 3v7M12 10c-3 0-5 2-6 5M12 10c3 0 5 2 6 5M12 10v8M9 21l3-3 3 3"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l8-8"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  sprout: '<path d="M12 21v-9M12 12C12 8 9 6 5 6c0 4 3 6 7 6zM12 10c0-3.5 2.5-6 7-6 0 4-3 6-7 6z"/>',
  chat: '<path d="M4 5h16v11H8l-4 4z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
};
const icon = (name, cls = "h-5 w-5") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const NAV = [
  { href: "products.html", label: "Products", key: "products" },
  { href: "solutions.html", label: "Solutions", key: "solutions" },
  { href: "about.html", label: "About", key: "about" },
  { href: "contact.html", label: "Contact", key: "contact" },
];

// ---------- layout ----------
function layout({ file, title, description, active, body, scripts = [] }) {
  const depth = file.split("/").length - 1;
  const r = "../".repeat(depth);
  const canonical = `${SITE.url}/${file === "index.html" ? "" : file}`;
  const fullTitle = file === "index.html" ? `${SITE.name} | Organic Biofertilizers for Colorado Parks & Turf` : `${title} | ${SITE.name}`;
  const navLink = (n, mobile) => {
    const on = n.key === active;
    return mobile
      ? `<a href="${r}${n.href}" class="block rounded-lg px-3 py-3 text-base font-medium ${on ? "bg-forest-50 text-forest-900" : "text-stone-700 hover:bg-stone-50"}"${on ? ' aria-current="page"' : ""}>${n.label}</a>`
      : `<a href="${r}${n.href}" class="rounded-md px-3 py-2 text-sm font-medium transition-colors ${on ? "text-field-700" : "text-stone-700 hover:text-forest-900"}"${on ? ' aria-current="page"' : ""}>${n.label}</a>`;
  };
  const calcOn = active === "calculator";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE.url}/assets/img/logo-full.png">
<meta name="theme-color" content="#183022">
<link rel="icon" type="image/png" sizes="32x32" href="${r}favicon-32.png">
<link rel="apple-touch-icon" href="${r}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r}assets/css/site.css">
</head>
<body class="flex min-h-screen flex-col">
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">Skip to content</a>

<header class="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
  <div class="container-site flex h-16 items-center justify-between gap-4 lg:h-20">
    <a href="${r}index.html" class="shrink-0" aria-label="${SITE.name} home">
      <img src="${r}assets/img/logo-lockup.png" alt="${SITE.name}" width="915" height="275" class="h-10 w-auto lg:h-12">
    </a>
    <nav class="hidden items-center gap-1 lg:flex" aria-label="Main">
      ${NAV.slice(0, 2).map((n) => navLink(n)).join("\n      ")}
      <a href="${r}calculator.html" class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${calcOn ? "text-field-700" : "text-stone-700 hover:text-forest-900"}"${calcOn ? ' aria-current="page"' : ""}>${icon("calc", "h-4 w-4")}Cost Calculator</a>
      ${NAV.slice(2).map((n) => navLink(n)).join("\n      ")}
    </nav>
    <div class="flex items-center gap-2">
      <a href="${r}contact.html#quote" class="btn-primary hidden sm:inline-flex">Request a Quote</a>
      <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-forest-900 hover:bg-stone-100 lg:hidden" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
        <span data-menu-open>${icon("menu", "h-6 w-6")}</span><span data-menu-close class="hidden">${icon("close", "h-6 w-6")}</span>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden border-t border-stone-200 bg-white lg:hidden">
    <nav class="container-site space-y-1 py-4" aria-label="Mobile">
      ${NAV.slice(0, 2).map((n) => navLink(n, true)).join("\n      ")}
      <a href="${r}calculator.html" class="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium ${calcOn ? "bg-forest-50 text-forest-900" : "text-stone-700 hover:bg-stone-50"}">${icon("calc")}Cost Calculator</a>
      ${NAV.slice(2).map((n) => navLink(n, true)).join("\n      ")}
      <div class="grid gap-2 pt-3 sm:grid-cols-2">
        <a href="${r}contact.html#quote" class="btn-primary w-full">Request a Quote</a>
        <a href="tel:${SITE.phoneHref}" class="btn-outline w-full">${icon("phone", "h-4 w-4")}${SITE.phone}</a>
      </div>
    </nav>
  </div>
</header>

<main id="main" class="flex-1">
${body}
</main>

<footer class="bg-forest-950 text-forest-100">
  <div class="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
    <div class="lg:col-span-4">
      <img src="${r}assets/img/logo-lockup-light.png" alt="${SITE.name}" width="915" height="275" class="h-12 w-auto" loading="lazy">
      <p class="mt-5 max-w-sm text-sm leading-relaxed text-forest-200">Regenerative, science-backed soil nutrition for parks, athletic fields, landscapes and farms. Based in the San Luis Valley and serving Southern Colorado.</p>
      <p class="mt-4 text-xs text-forest-300">Authorized distributor of Sigma AgriScience organic biofertilizers.</p>
    </div>
    <div class="lg:col-span-2">
      <h2 class="font-sans text-sm font-semibold text-white">Explore</h2>
      <ul class="mt-4 space-y-2.5 text-sm">
        <li><a class="hover:text-white" href="${r}products.html">All Products</a></li>
        <li><a class="hover:text-white" href="${r}solutions.html">Solutions</a></li>
        <li><a class="hover:text-white" href="${r}calculator.html">Cost Calculator</a></li>
        <li><a class="hover:text-white" href="${r}${PRICE_PDF}" download>Pricing at a Glance (PDF)</a></li>
        <li><a class="hover:text-white" href="${r}about.html">About Us</a></li>
      </ul>
    </div>
    <div class="lg:col-span-3">
      <h2 class="font-sans text-sm font-semibold text-white">Product Lines</h2>
      <ul class="mt-4 space-y-2.5 text-sm">
        ${LINES.map((l) => `<li><a class="hover:text-white" href="${r}products.html?line=${l.id}">${l.label}</a></li>`).join("\n        ")}
      </ul>
    </div>
    <div class="lg:col-span-3">
      <h2 class="font-sans text-sm font-semibold text-white">Contact</h2>
      <ul class="mt-4 space-y-3 text-sm">
        <li><a class="flex items-center gap-2.5 hover:text-white" href="mailto:${SITE.email}">${icon("mail", "h-4 w-4 shrink-0")}${SITE.email}</a></li>
        <li><a class="flex items-center gap-2.5 hover:text-white" href="tel:${SITE.phoneHref}">${icon("phone", "h-4 w-4 shrink-0")}${SITE.phone}</a></li>
        <li class="flex items-center gap-2.5">${icon("pin", "h-4 w-4 shrink-0")}${SITE.region}</li>
      </ul>
      <a href="${r}contact.html#quote" class="btn-primary mt-6">Request a Quote</a>
    </div>
  </div>
  <div class="border-t border-white/10">
    <div class="container-site flex flex-col gap-2 py-6 text-xs text-forest-300 sm:flex-row sm:items-center sm:justify-between">
      <p>&copy; <span data-year>2026</span> ${SITE.name}. All rights reserved.</p>
      <p>Product information, labels and images courtesy of Sigma AgriScience. OMRI Listed status applies to specific products as noted.</p>
    </div>
  </div>
</footer>
<script src="${r}assets/js/main.js" defer></script>
${scripts.map((s) => `<script src="${r}${s}" defer></script>`).join("\n")}
</body>
</html>
`;
}

// ---------- shared blocks ----------
const pageHeader = ({ eyebrow, title, lede, image, r = "" }) => `
<section class="relative isolate overflow-hidden bg-forest-950">
  ${image ? `<img src="${r}${image}" alt="" class="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" fetchpriority="high">` : ""}
  <div class="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950 via-forest-950/80 to-forest-950/30"></div>
  <div class="container-site py-14 sm:py-20">
    <p class="eyebrow !text-sun-300">${eyebrow}</p>
    <h1 class="mt-3 max-w-3xl text-3xl font-semibold leading-tight !text-white sm:text-5xl">${title}</h1>
    ${lede ? `<p class="mt-4 max-w-2xl text-base leading-relaxed text-forest-100 sm:text-lg">${lede}</p>` : ""}
  </div>
</section>`;

const ctaBand = (r = "") => `
<section class="bg-forest-50">
  <div class="container-site py-14 sm:py-16">
    <div class="grid items-center gap-8 rounded-3xl bg-forest-900 p-8 sm:p-12 lg:grid-cols-[1fr_auto]">
      <div>
        <h2 class="text-2xl font-semibold !text-white sm:text-3xl">Planning next season's program?</h2>
        <p class="mt-3 max-w-2xl text-forest-100">Tell us about your sites and acreage. We'll recommend products and rates, send labels and SDS sheets for your files, and put together a formal quote.</p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
        <a href="${r}contact.html#quote" class="btn-primary">Request a Quote ${icon("arrow", "h-4 w-4")}</a>
        <a href="${r}calculator.html" class="btn-ghost-light">${icon("calc", "h-4 w-4")}Estimate Costs</a>
      </div>
    </div>
  </div>
</section>`;

const npkOf = (p) => (p.npk ? p.npk.split("-") : null);

function productCard(p, r = "") {
  const npk = npkOf(p);
  return `
  <article class="group card relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg" data-line="${p.line}">
    <div class="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-b from-stone-100 to-stone-50 p-6">
      ${p.image
        ? `<img src="${r}${p.image}" alt="${esc(p.name)} bag" class="h-full w-auto object-contain drop-shadow-xl transition duration-300 group-hover:scale-[1.03]" loading="lazy" width="774" height="900">`
        : `<div class="flex h-full w-3/5 flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-center"><span class="font-serif text-3xl font-semibold text-forest-900">${p.npk}</span><span class="mt-1 text-xs text-stone-500">Bag image coming soon</span></div>`}
      ${p.omri ? `<span class="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-[11px] font-bold tracking-wide text-forest-900 shadow-sm ring-1 ring-stone-200">OMRI LISTED</span>` : ""}
    </div>
    <div class="flex flex-1 flex-col p-5">
      <p class="text-xs font-medium uppercase tracking-wide text-field-700">${p.lineLabel}</p>
      <h3 class="mt-1 text-xl font-semibold"><a href="${r}products/${p.slug}.html" class="after:absolute after:inset-0">${nameHtml(p.name)}</a></h3>
      <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">${esc(p.description)}</p>
      <div class="mt-auto flex items-center justify-between pt-5">
        ${npk
          ? `<div class="flex gap-1.5 text-xs font-semibold tabular-nums">${["N", "P", "K"].map((k, i) => `<span class="rounded bg-forest-50 px-2 py-1 text-forest-900">${npk[i]}<span class="ml-0.5 font-normal text-stone-500">${k}</span></span>`).join("")}</div>`
          : `<span class="rounded bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800">72% SiO<sub>2</sub></span>`}
        <span class="inline-flex items-center gap-1 text-sm font-semibold text-field-700">Details ${icon("arrow", "h-4 w-4 transition group-hover:translate-x-0.5")}</span>
      </div>
    </div>
  </article>`;
}

// ---------- pages ----------
function home() {
  const segments = [
    { id: "parks", title: "Parks & Open Space", img: "city-park.webp", text: "Thicker, deeper-rooted turf that holds up to picnics, events and Colorado summers on less water." },
    { id: "athletic-fields", title: "Athletic Fields", img: "athletic-field.webp", text: "Root mass and fast recovery for soccer, football and ball fields under heavy traffic." },
    { id: "landscape", title: "Landscape, Trees & Beds", img: "landscape.webp", text: "Slow-release organic nutrition that won't burn roots, for medians, trails and civic grounds." },
    { id: "golf", title: "Golf Courses", img: "golf.webp", text: "Fine-grade formulas for greens, tees and fairways, plus hybrid Bio Bridge blends." },
    { id: "agriculture", title: "Farms & Restoration", img: "agriculture.webp", text: "Large-grade biofertilizers to rebuild soil biology on cropland and reclamation sites." },
  ];
  const body = `
<section class="relative isolate overflow-hidden bg-forest-950">
  <img src="assets/img/hero-roots.webp" alt="Healthy plant roots spreading through dark, living soil" class="absolute inset-0 -z-10 h-full w-full object-cover" fetchpriority="high">
  <div class="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950/95 via-forest-950/70 to-forest-950/30 lg:bg-gradient-to-r lg:from-forest-950/95 lg:via-forest-950/70 lg:to-transparent"></div>
  <div class="container-site flex min-h-[34rem] flex-col justify-end pb-12 pt-24 sm:min-h-[38rem] lg:justify-center lg:pb-24">
    <p class="eyebrow !text-sun-300">Southern Colorado · Authorized Sigma AgriScience Distributor</p>
    <h1 class="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] !text-white sm:text-5xl lg:text-6xl">Creating living soil for Colorado's parks, fields, farms &amp; gardens.</h1>
    <p class="mt-5 max-w-xl text-base leading-relaxed text-forest-100 sm:text-lg">Building resilience through improved soil &amp; plant health.</p>
    <div class="mt-8 flex flex-col gap-3 sm:flex-row">
      <a href="products.html" class="btn-primary text-base">Explore Products ${icon("arrow", "h-4 w-4")}</a>
      <a href="calculator.html" class="btn-ghost-light text-base">${icon("calc", "h-4 w-4")}Estimate Your Cost</a>
    </div>
  </div>
</section>

<section class="border-b border-stone-200 bg-white">
  <div class="container-site grid grid-cols-2 gap-x-6 gap-y-6 py-8 lg:grid-cols-4">
    ${[
      ["shield", "OMRI Listed", "Organic formulas with OMRI certificates on file"],
      ["sprout", "Biology in every bag", "Bacillus, mycorrhizae, Trichoderma &amp; humic acids"],
      ["water", "Suitable for wet or dry climates", "Healthier soil structure and stronger roots"],
      ["truck", "Bags, totes or bulk", "50 lb bags, 2,000 lb totes and bulk loads"],
    ].map(([ic, t, s]) => `<div class="flex gap-3"><span class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-field-50 text-field-700">${icon(ic)}</span><div><p class="text-sm font-semibold text-forest-950">${t}</p><p class="mt-0.5 text-xs leading-snug text-stone-600 sm:text-sm">${s}</p></div></div>`).join("\n    ")}
  </div>
</section>

<section class="py-16 sm:py-24">
  <div class="container-site">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div class="max-w-2xl">
        <p class="eyebrow">Who we serve</p>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Programs for every kind of public and working landscape</h2>
      </div>
      <a href="solutions.html" class="inline-flex items-center gap-1.5 text-sm font-semibold text-field-700 hover:text-field-600">See all solutions ${icon("arrow", "h-4 w-4")}</a>
    </div>
    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
      ${segments.map((s, i) => `
      <a href="solutions.html#${s.id}" class="group relative isolate flex min-h-[17rem] flex-col justify-end overflow-hidden rounded-2xl p-6 ${i < 2 ? "lg:col-span-3 lg:min-h-[22rem]" : "lg:col-span-2"}">
        <img src="assets/img/${s.img}" alt="" class="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy">
        <div class="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950/90 via-forest-950/40 to-transparent"></div>
        <h3 class="text-xl font-semibold !text-white sm:text-2xl">${s.title}</h3>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-forest-100">${s.text}</p>
        <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sun-300">Learn more ${icon("arrow", "h-4 w-4 transition group-hover:translate-x-0.5")}</span>
      </a>`).join("")}
    </div>
  </div>
</section>

<section class="bg-stone-50 py-16 sm:py-24">
  <div class="container-site grid items-center gap-12 lg:grid-cols-2">
    <div class="relative">
      <img src="assets/img/root-mass.webp" alt="Turf plug held up to show a dense root system" class="aspect-[4/5] w-full rounded-3xl object-cover sm:aspect-[5/4] lg:aspect-[4/5]" loading="lazy">
      <div class="absolute -bottom-6 right-4 max-w-[16rem] rounded-2xl bg-white p-5 shadow-xl ring-1 ring-stone-200 sm:right-8">
        <p class="font-serif text-lg font-semibold text-forest-950">Below the surface</p>
        <p class="mt-1 text-sm text-stone-600">Healthy turf starts with roots and the soil biology that feeds them.</p>
      </div>
    </div>
    <div>
      <p class="eyebrow">Why biological fertility</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Feed the soil, and the soil feeds the turf</h2>
      <p class="mt-5 leading-relaxed text-stone-700">Conventional programs push top growth and leave soil depleted. Each Sigma granule combines slow-release organic nutrients, humic acids and live beneficial organisms. Together they cycle nutrients, improve soil structure and grow the deep roots that carry turf through drought, heat and heavy traffic.</p>
      <dl class="mt-8 space-y-6">
        ${[
          ["Beneficial Bacillus bacteria", "Attach to roots and help plants take up nitrogen, phosphorus and potassium, while crowding out harmful bacteria."],
          ["Mycorrhizal fungi", "Colonize the root zone while connecting plants under the surface, reduce soil pathogens and promote vigorous, healthy growth."],
          ["Trichoderma fungi", "Extend the root system's reach several hundredfold through fine fungal filaments, improving access to water and nutrients."],
          ["Humic acids & organic carbon", "Hold nutrients and moisture in the root zone and feed the soil's microbial life."],
        ].map(([t, d]) => `<div class="flex gap-4"><span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-field-600 text-white">${icon("check", "h-3.5 w-3.5")}</span><div><dt class="font-semibold text-forest-950">${t}</dt><dd class="mt-1 text-sm leading-relaxed text-stone-600">${d}</dd></div></div>`).join("\n        ")}
      </dl>
    </div>
  </div>
</section>

<section class="py-16 sm:py-24">
  <div class="container-site">
    <div class="max-w-2xl">
      <p class="eyebrow">Our product lines</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Harnessing the power of nature</h2>
    </div>
    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      ${LINES.map((l) => {
        const items = PRODUCTS.filter((p) => p.line === l.id);
        const lead = items.find((p) => p.image);
        return `
      <a href="products.html?line=${l.id}" class="group card flex flex-col overflow-hidden transition hover:shadow-lg">
        <div class="flex h-48 items-end justify-center gap-[-1rem] bg-gradient-to-b from-forest-50 to-white pt-6">
          <img src="${lead.image}" alt="" class="h-40 w-auto object-contain drop-shadow-lg transition duration-300 group-hover:-translate-y-1" loading="lazy">
        </div>
        <div class="flex flex-1 flex-col p-5">
          <h3 class="text-lg font-semibold">${l.label}</h3>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-stone-600">${l.blurb}</p>
          <p class="mt-4 flex items-center justify-between text-sm"><span class="text-stone-500">${items.length} product${items.length > 1 ? "s" : ""}</span><span class="inline-flex items-center gap-1 font-semibold text-field-700">View ${icon("arrow", "h-4 w-4")}</span></p>
        </div>
      </a>`;
      }).join("")}
    </div>
  </div>
</section>

<section class="relative isolate overflow-hidden bg-forest-900">
  <img src="assets/img/granules.webp" alt="" class="absolute inset-0 -z-10 h-full w-full object-cover opacity-20" loading="lazy">
  <div class="container-site grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
    <div>
      <p class="eyebrow !text-sun-300">Free planning tool</p>
      <h2 class="mt-3 text-3xl font-semibold !text-white sm:text-4xl">Budget your season in under a minute</h2>
      <p class="mt-4 max-w-xl text-forest-100">Enter your acreage or square footage, choose a nitrogen rate, and the calculator works out how many 50 lb bags you need and what they cost. It compares every product side by side.</p>
      <a href="calculator.html" class="btn mt-8 bg-sun-400 text-forest-950 hover:bg-sun-300">${icon("calc", "h-4 w-4")}Open the Cost Calculator</a>
    </div>
    <ul class="grid gap-3 sm:grid-cols-2">
      ${[
        ["Acres or sq ft", "Switch units and the area converts automatically."],
        ["Low, medium or high N", "Rates scale to 0.25, 0.5 or 1 lb N per 1,000 sq ft."],
        ["Multiple applications", "Plan a full season of feedings in one estimate."],
        ["Side-by-side comparison", "See cost per acre and per 1,000 sq ft for every formula."],
      ].map(([t, d]) => `<li class="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur"><p class="font-semibold text-white">${t}</p><p class="mt-1 text-sm text-forest-100">${d}</p></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section class="bg-stone-50 py-16 sm:py-20">
  <div class="container-site grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
    <div>
      <p class="eyebrow">Rooted in the San Luis Valley</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">A local partner for healthier ground</h2>
      <p class="mt-4 leading-relaxed text-stone-700">Terra Elemental gives Colorado's land managers access to regenerative, science-backed soil biotechnology. We know high-altitude, semi-arid ground firsthand, and we help you swap costly conventional inputs for programs that rebuild soil from the ground up.</p>
      <a href="about.html" class="btn-outline mt-6">Meet the team ${icon("arrow", "h-4 w-4")}</a>
    </div>
    <div class="flex justify-center gap-6 sm:gap-10">
      ${TEAM.map((t) => teamAvatar(t, "h-32 w-32 sm:h-40 sm:w-40", true)).join("")}
    </div>
  </div>
</section>
${ctaBand()}`;
  return layout({
    file: "index.html",
    title: "Home",
    active: "home",
    description: "Terra Elemental supplies OMRI Listed organic biofertilizers from Sigma AgriScience to parks departments, athletic fields, golf courses and farms across Southern Colorado.",
    body,
  });
}

function teamAvatar(t, size, compact = false, r = "") {
  const img = exists(t.photo)
    ? `<img src="${r}${t.photo}" alt="${t.name}" class="${size} rounded-full object-cover shadow-lg ring-4 ring-white" loading="lazy">`
    : `<div class="${size} flex items-center justify-center rounded-full bg-gradient-to-br from-forest-700 to-forest-900 font-serif text-4xl font-semibold text-white shadow-lg ring-4 ring-white" role="img" aria-label="${t.name} (photo coming soon)">${initials(t.name)}</div>`;
  return `<figure class="flex flex-col items-center text-center">${img}<figcaption class="mt-4"><p class="font-serif ${compact ? "text-lg" : "text-xl"} font-semibold text-forest-950">${t.name}</p><p class="text-sm text-stone-600">${t.role}</p></figcaption></figure>`;
}

function productsPage() {
  const body = `
${pageHeader({ eyebrow: "Products", title: "Organic biofertilizers built on living soil science", lede: "Every formula combines slow-release organic nutrients, humic acids and beneficial biology. Filter by product line, or open any product for its guaranteed analysis, application rates and documents.", image: "assets/img/granules.webp" })}
<section class="py-12 sm:py-16">
  <div class="container-site">
    <div class="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div class="flex w-max gap-2" role="group" aria-label="Filter by product line" data-filter-group>
        <button type="button" data-filter="all" aria-pressed="true" class="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-forest-400 aria-pressed:border-forest-900 aria-pressed:bg-forest-900 aria-pressed:text-white">All products <span class="ml-1 opacity-60">${PRODUCTS.length}</span></button>
        ${LINES.map((l) => `<button type="button" data-filter="${l.id}" aria-pressed="false" class="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-forest-400 aria-pressed:border-forest-900 aria-pressed:bg-forest-900 aria-pressed:text-white">${l.label} <span class="ml-1 opacity-60">${PRODUCTS.filter((p) => p.line === l.id).length}</span></button>`).join("\n        ")}
      </div>
    </div>
    ${LINES.map((l) => `
    <div class="mt-10" data-line-section="${l.id}">
      <div class="mb-6 flex flex-col gap-1 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 class="text-2xl font-semibold">${l.label}</h2>
        <p class="max-w-xl text-sm text-stone-600">${l.blurb}</p>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        ${PRODUCTS.filter((p) => p.line === l.id).map((p) => productCard(p)).join("")}
      </div>
    </div>`).join("")}

    <div class="mt-16 grid gap-6 rounded-3xl border border-stone-200 bg-stone-50 p-6 sm:p-10 md:grid-cols-2">
      <div>
        <h2 class="text-2xl font-semibold">Not sure which formula fits?</h2>
        <p class="mt-2 text-stone-600">Start with our solutions guide for parks, athletic fields, landscapes and golf, or let us build a program around your sites.</p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row md:items-center md:justify-end">
        <a href="${PRICE_PDF}" class="btn-outline" download>${icon("download", "h-4 w-4")}Pricing PDF</a>
        <a href="calculator.html" class="btn-dark">${icon("calc", "h-4 w-4")}Compare costs</a>
      </div>
    </div>
  </div>
</section>
${ctaBand()}`;
  return layout({
    file: "products.html",
    title: "Products",
    active: "products",
    description: "Sigma AgriScience organic granular biofertilizers available from Terra Elemental: large-grade agriculture formulas, fine-grade specialty turf products, Bio Bridge hybrids and Sigma Si silica.",
    body,
  });
}

function productPage(p) {
  const r = "../";
  const npk = npkOf(p);
  const related = PRODUCTS.filter((q) => q.slug !== p.slug && (q.line === p.line || (p.line === "amendment" && q.line === "specialty"))).slice(0, 4);
  const calcLink = p.calcName ? `${r}calculator.html?product=${p.slug}` : null;
  const localDocs = p.docs.filter((d) => !d.external);

  const npkBoxes = npk
    ? `<div class="mt-6 grid max-w-sm grid-cols-3 gap-2">${[["Nitrogen", "N"], ["Phosphate", "P₂O₅"], ["Potash", "K₂O"]].map(([n, s], i) => `<div class="rounded-xl bg-forest-50 px-3 py-3 text-center"><p class="font-serif text-3xl font-semibold tabular-nums text-forest-950">${npk[i]}<span class="text-lg">%</span></p><p class="text-xs text-stone-600">${n} <span class="text-stone-400">${s}</span></p></div>`).join("")}</div>`
    : `<div class="mt-6 inline-flex rounded-xl bg-sky-50 px-5 py-3"><p class="font-serif text-3xl font-semibold text-sky-800">72%<span class="ml-2 font-sans text-sm font-medium">Silicon dioxide (SiO₂)</span></p></div>`;

  const analysis = p.analysis.length ? `
      <div class="card p-6">
        <h3 class="text-xl font-semibold">Guaranteed analysis</h3>
        <table class="data-table mt-4 w-full"><tbody>
          ${p.analysis.map((a) => `<tr><th scope="row" class="${a.sub ? "!pl-4 !text-stone-500" : ""}">${a.sub ? "↳ " : ""}${esc(a.item)}</th><td class="${a.sub ? "!font-normal !text-stone-600" : ""}">${esc(a.value)}</td></tr>`).join("\n          ")}
        </tbody></table>
        ${p.derived ? `<p class="mt-4 text-sm leading-relaxed text-stone-600">${esc(p.derived)}</p>` : ""}
        ${p.notes.map((n) => `<p class="mt-3 text-sm leading-relaxed text-stone-600">${esc(n)}</p>`).join("")}
      </div>` : "";

  const bio = p.biologicals.length ? `
      <div class="card bg-gradient-to-br from-field-50 to-white p-6">
        <h3 class="flex items-center gap-2 text-xl font-semibold"><span class="text-field-700">${icon("sprout")}</span>Value-added biologicals</h3>
        <table class="data-table mt-4 w-full"><tbody>
          ${p.biologicals.map((a) => `<tr><th scope="row">${esc(a.item)}</th><td>${esc(a.value)}</td></tr>`).join("\n          ")}
        </tbody></table>
        <p class="mt-4 text-sm leading-relaxed text-stone-600">Beneficial bacteria, endomycorrhizae and Trichoderma are granulated into a microbial food source so they establish quickly in the root zone. Full species counts are listed on the product label.</p>
      </div>` : "";

  const rates = p.rates.length ? `
  <section class="border-t border-stone-200 py-12 sm:py-16">
    <div class="container-site">
      <h2 class="text-2xl font-semibold sm:text-3xl">Application rates</h2>
      <p class="mt-2 max-w-2xl text-stone-600">Manufacturer-recommended rates. Always follow the product label, and contact us for a program tailored to your sites.</p>
      <div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        ${p.rates.map((s) => `
        <div class="card p-6">
          <h3 class="text-lg font-semibold">${esc(s.heading)}</h3>
          ${s.intro ? `<p class="mt-2 text-sm text-stone-600">${esc(s.intro)}</p>` : ""}
          <dl class="mt-4 space-y-3">
            ${s.rows.map((row) => `<div class="${/^(Low|Medium|High) Rate$/.test(row.label) && /^\(/.test(row.text) && s.heading === "Ornamentals" ? "border-t border-stone-200 pt-3 first:border-0 first:pt-0" : ""}"><dt class="text-xs font-semibold uppercase tracking-wide text-field-700">${esc(row.label)}</dt><dd class="mt-0.5 text-sm text-stone-800">${esc(row.text)}</dd></div>`).join("\n            ")}
          </dl>
        </div>`).join("")}
        ${p.containers.length ? `
        <div class="card p-6">
          <h3 class="text-lg font-semibold">Container sizes</h3>
          <table class="mt-4 w-full text-sm">
            <thead><tr class="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500"><th class="pb-2 font-medium">Pot</th><th class="pb-2 text-right font-medium">Low rate</th><th class="pb-2 text-right font-medium">High rate</th></tr></thead>
            <tbody>${p.containers.map((c) => `<tr class="border-b border-stone-100 last:border-0"><td class="py-2">${esc(c.size)}</td><td class="py-2 text-right tabular-nums">${esc(c.low)}</td><td class="py-2 text-right tabular-nums">${esc(c.high)}</td></tr>`).join("")}</tbody>
          </table>
        </div>` : ""}
      </div>
    </div>
  </section>` : "";

  const docs = `
      <div class="card p-6">
        <h3 class="text-xl font-semibold">Documents</h3>
        ${p.docs.length ? `<ul class="mt-4 divide-y divide-stone-200">
          ${p.docs.map((d) => `<li><a href="${d.external ? d.href : r + d.href}" ${d.external ? 'target="_blank" rel="noopener"' : "download"} class="group flex items-center gap-3 py-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${d.type === "OMRI" ? "bg-sky-50 text-sky-700" : "bg-forest-50 text-forest-800"}">${icon(d.type === "OMRI" ? "shield" : "doc")}</span><span class="flex-1"><span class="block text-sm font-semibold text-forest-950 group-hover:text-field-700">${d.label}</span><span class="block text-xs text-stone-500">${d.external ? "View on omri.org" : `PDF · ${fmtSize(d.size)}`}</span></span><span class="text-stone-400 group-hover:text-field-700">${icon(d.external ? "external" : "download", "h-4 w-4")}</span></a></li>`).join("\n          ")}
        </ul>` : `<p class="mt-3 text-sm text-stone-600">The label, SDS and specification sheet for this product are available on request.</p><a href="${r}contact.html?product=${p.slug}#quote" class="btn-outline mt-4">Request documents</a>`}
      </div>`;

  const features = p.features.map((f) => `
      <div class="card p-6 lg:col-span-2">
        <h3 class="text-xl font-semibold">${esc(f.heading)}</h3>
        <p class="mt-3 text-sm leading-relaxed text-stone-700">${esc(f.text)}</p>
      </div>`).join("");

  const body = `
<nav aria-label="Breadcrumb" class="border-b border-stone-200 bg-stone-50">
  <ol class="container-site flex flex-wrap items-center gap-1.5 py-3 text-sm text-stone-500">
    <li><a href="${r}index.html" class="hover:text-forest-900">Home</a></li><li aria-hidden="true">/</li>
    <li><a href="${r}products.html" class="hover:text-forest-900">Products</a></li><li aria-hidden="true">/</li>
    <li><a href="${r}products.html?line=${p.line}" class="hover:text-forest-900">${p.lineLabel}</a></li><li aria-hidden="true">/</li>
    <li aria-current="page" class="font-medium text-forest-900">${esc(p.name)}</li>
  </ol>
</nav>

<section class="py-10 sm:py-16">
  <div class="container-site grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
    <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-stone-100 via-stone-50 to-forest-50 p-8 sm:p-12 lg:sticky lg:top-28">
      ${p.image
        ? `<img src="${r}${p.image}" alt="${esc(p.name)} 50 lb bag" class="h-full w-auto object-contain drop-shadow-2xl" width="774" height="900" fetchpriority="high">`
        : `<div class="text-center"><p class="font-serif text-7xl font-semibold text-forest-900">${p.npk}</p><p class="mt-3 text-sm text-stone-500">Bag image coming soon</p></div>`}
      ${p.omri ? `<span class="absolute left-5 top-5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-forest-900 shadow ring-1 ring-stone-200">OMRI LISTED</span>` : ""}
    </div>
    <div>
      <p class="eyebrow">${p.lineLabel}</p>
      <h1 class="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">${nameHtml(p.name)}</h1>
      <p class="mt-2 text-lg text-stone-600">${esc(p.subtitle)}</p>
      ${npkBoxes}
      <p class="mt-6 leading-relaxed text-stone-700">${esc(p.description)}</p>

      <div class="mt-6 rounded-2xl border border-stone-200 p-5">
        <p class="text-sm font-semibold text-forest-950">Available packaging</p>
        <ul class="mt-3 flex flex-wrap gap-2">${p.packaging.map((k) => `<li class="chip">${icon("check", "h-3.5 w-3.5 text-field-600")}${k}</li>`).join("")}</ul>
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="${r}contact.html?product=${p.slug}#quote" class="btn-primary">Request a Quote ${icon("arrow", "h-4 w-4")}</a>
        ${calcLink ? `<a href="${calcLink}" class="btn-outline">${icon("calc", "h-4 w-4")}Estimate Cost</a>` : ""}
        ${localDocs[0] ? `<a href="${r}${localDocs[0].href}" class="btn-outline" download>${icon("download", "h-4 w-4")}Label (PDF)</a>` : ""}
      </div>
      ${p.placeholder ? `<p class="mt-6 rounded-xl bg-sun-300/30 p-4 text-sm text-forest-950">Full specifications for this product are being finalized. Contact us for the current label, analysis and pricing.</p>` : ""}
    </div>
  </div>
</section>

${p.analysis.length || p.docs.length || p.placeholder ? `
<section class="border-t border-stone-200 bg-stone-50 py-12 sm:py-16">
  <div class="container-site grid gap-6 lg:grid-cols-2">
    ${analysis}
    <div class="grid gap-6 content-start">
      ${bio}
      ${docs}
    </div>
    ${features}
  </div>
</section>` : ""}
${rates}

${related.length ? `
<section class="border-t border-stone-200 py-12 sm:py-16">
  <div class="container-site">
    <div class="flex items-end justify-between gap-4">
      <h2 class="text-2xl font-semibold sm:text-3xl">Related products</h2>
      <a href="${r}products.html" class="hidden items-center gap-1 text-sm font-semibold text-field-700 sm:inline-flex">All products ${icon("arrow", "h-4 w-4")}</a>
    </div>
    <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">${related.map((q) => productCard(q, r)).join("")}</div>
  </div>
</section>` : ""}
${ctaBand(r)}`;
  return layout({
    file: `products/${p.slug}.html`,
    title: p.name,
    active: "products",
    description: `${p.name}: ${p.description}`.slice(0, 158),
    body,
  });
}

function solutionsPage() {
  const sections = [
    {
      id: "parks", eyebrow: "Parks & open space", title: "Durable, green turf on less water", img: "city-park.webp",
      text: [
        "City parks take everything at once: foot traffic, events, pets, mowing and Colorado's dry, high-altitude summers. Shallow-rooted turf is the first to thin and brown out. A biological program builds root depth and soil structure so turf uses irrigation more efficiently and recovers faster.",
        "Sigma's organic granules release nutrients slowly and won't burn, so there's less risk on hot days and less surge growth to mow. The biology in every bag keeps working between applications.",
      ],
      points: ["Slow, even release: fewer surge-mowing cycles", "Stronger roots for drought and heat tolerance", "Low-phosphorus options where P is restricted", "Organic, OMRI Listed formulas for public spaces"],
    },
    {
      id: "athletic-fields", eyebrow: "Athletic fields", title: "Root mass that stands up to game day", img: "athletic-field.webp",
      text: [
        "Constant play and mowing wear sports turf down, which is why root mass and depth matter so much on soccer, football and multi-use fields. High-grade biofertilizers supply the nutrients plants need to make their own growth hormones, improving soil health and turf vigor.",
        "Fields stay dense and resilient, and they recover faster from damage, weather and heavy schedules. For quick green-up before a season or tournament, Bio Bridge hybrids pair organic biology with polymer-coated nitrogen.",
      ],
      points: ["Faster recovery from wear and divots", "Improved disease resistance through healthier soil", "Bio Bridge for fast green-up plus long feeding", "Silica to strengthen leaf blades"],
    },
    {
      id: "landscape", eyebrow: "Landscape, trees & beds", title: "Healthy plantings along trails, medians and civic grounds", img: "landscape.webp",
      text: [
        "Environmental stress such as heat, drought, compaction and transplant shock causes plant decline, wilt and disease. Value-added biologicals create a favorable environment for developing roots, so new plantings establish quickly and mature trees and shrubs stay vigorous.",
        "Each formula lists rates for tree and shrub transplanting by trunk caliper, landscape beds and container stock, making them easy to roll out across a crew.",
      ],
      points: ["Faster establishment of new plantings", "Tree rates by trunk caliper at transplanting", "Bed and container rates on every label", "Reduces reliance on synthetic inputs"],
    },
    {
      id: "golf", eyebrow: "Golf courses", title: "Tournament-ready turf through every season", img: "golf.webp",
      text: [
        "Fine-grade (SGN 110) granules sift into tight canopies on greens and tees without pickup by mowers. They're formulated for spring and fall aeration recovery, midsummer stress, dormant feeding, cool-season overseeding and warm-season transition.",
        "For fairways and roughs, Bio Bridge blends deliver up to 10 weeks of plant response per application.",
      ],
      points: ["Micro-granular sizing for greens and tees", "Aeration recovery and overseeding nutrition", "Low-P 6-2-6 for restricted areas", "Up to 10-week feeding with Bio Bridge"],
    },
    {
      id: "agriculture", eyebrow: "Farms & restoration", title: "Rebuild soil biology on working and recovering land", img: "agriculture.webp",
      text: [
        "Modern practices can strip soil of life and structure. Large-grade Sigma biofertilizers combine fast and slow-release organic nutrients with humic acids and beneficial microbes to recharge depleted soils, from vegetable ground and hay fields to reclamation and restoration sites.",
        "Apply on their own or dry-blend with conventional fertilizer to improve performance, with vegetable rates listed by crop on every label.",
      ],
      points: ["Recharge depleted and disturbed soils", "Dry-blend with conventional programs", "Crop-specific vegetable rates", "Non-manure 8-5-1 option"],
    },
  ];

  const body = `
${pageHeader({ eyebrow: "Solutions", title: "The right program for every landscape you manage", lede: "From neighborhood parks and ball fields to golf courses and restoration sites, here's where each Sigma formula fits best.", image: "assets/img/sod-farm.webp" })}

<nav class="sticky top-16 z-40 border-b border-stone-200 bg-white/95 backdrop-blur lg:top-20" aria-label="Solutions">
  <div class="container-site -mb-px flex gap-1 overflow-x-auto py-2">
    ${sections.map((s) => `<a href="#${s.id}" class="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-forest-50 hover:text-forest-900">${s.eyebrow}</a>`).join("\n    ")}
  </div>
</nav>

${sections.map((s, i) => `
<section id="${s.id}" class="${i % 2 ? "bg-stone-50" : ""} py-14 sm:py-20">
  <div class="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
    <img src="assets/img/${s.img}" alt="" class="aspect-[4/3] w-full rounded-3xl object-cover ${i % 2 ? "lg:order-2" : ""}" loading="lazy">
    <div>
      <p class="eyebrow">${s.eyebrow}</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">${s.title}</h2>
      ${s.text.map((t) => `<p class="mt-4 leading-relaxed text-stone-700">${t}</p>`).join("")}
      <ul class="mt-6 grid gap-2.5 sm:grid-cols-2">${s.points.map((pt) => `<li class="flex gap-2 text-sm text-stone-800"><span class="mt-0.5 text-field-600">${icon("check", "h-4 w-4")}</span>${pt}</li>`).join("")}</ul>
    </div>
  </div>
</section>`).join("")}

<section class="bg-forest-950 py-14 sm:py-20">
  <div class="container-site">
    <div class="max-w-2xl">
      <p class="eyebrow !text-sun-300">Colorado conditions</p>
      <h2 class="mt-3 text-3xl font-semibold !text-white sm:text-4xl">Built for high, dry and alkaline ground</h2>
      <p class="mt-4 text-forest-100">Southern Colorado's short seasons, intense sun, low rainfall and watering restrictions are hard on turf and plantings. Here's how a biological program helps.</p>
    </div>
    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      ${[
        ["water", "Stretch irrigation", "Mycorrhizal networks and humic acids help roots reach and hold more of the water you apply."],
        ["root", "Deeper roots", "Biology-driven root growth carries turf through heat and drought."],
        ["layers", "Rebuild structure", "Organic carbon feeds soil life that improves tilth in compacted and depleted soils."],
        ["leaf", "Gentle on sites", "Slow-release organic nitrogen won't burn and reduces surge growth."],
      ].map(([ic, t, d]) => `<div class="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"><span class="text-sun-300">${icon(ic, "h-7 w-7")}</span><h3 class="mt-4 text-lg font-semibold !text-white">${t}</h3><p class="mt-2 text-sm leading-relaxed text-forest-200">${d}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>
${ctaBand()}`;
  return layout({
    file: "solutions.html",
    title: "Solutions",
    active: "solutions",
    description: "Biological fertility programs for city parks, athletic fields, landscapes, golf courses and farms in Southern Colorado, with recommended Sigma AgriScience products for each.",
    body,
  });
}

function aboutPage() {
  const body = `
${pageHeader({ eyebrow: "About Terra Elemental", title: "Regenerating soil. Restoring balance. Rethinking how we grow.", lede: "Science-backed, nature-driven solutions to soil degradation, water scarcity and food security, built in the San Luis Valley, Colorado.", image: "assets/img/seedling.webp" })}

<section class="py-14 sm:py-20">
  <div class="container-site grid gap-12 lg:grid-cols-2 lg:gap-16">
    <div>
      <p class="eyebrow">Who we are</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Soil biotechnology for the land Coloradans care for</h2>
      <div class="prose-site mt-5">
        <p>Terra Elemental provides access to regenerative, sustainable and holistic biotechnology that serves the needs of soil, plants and people. We work with parks and recreation departments, grounds managers, golf courses, growers and restoration teams across Southern Colorado.</p>
        <p>Through consulting and supply, we help clients replace costly conventional amendments with effective, affordable biological programs that rebuild soil from the ground up, so it holds water, cycles nutrients and supports healthy plants year after year.</p>
        <p>We address these challenges at the source, below the surface.</p>
      </div>
    </div>
    <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      ${[
        ["Soil degradation", "Modern practices strip soil of life and structure."],
        ["Water scarcity", "Irrigation demands keep rising in dry climates like ours."],
        ["Nutrient inefficiency", "Plants often can't access the nutrients already in the soil."],
      ].map(([t, d], i) => `<div class="card flex gap-4 p-5"><span class="font-serif text-3xl font-semibold text-field-600">0${i + 1}</span><div><h3 class="text-lg font-semibold">${t}</h3><p class="mt-1 text-sm text-stone-600">${d}</p></div></div>`).join("\n      ")}
    </div>
  </div>
</section>

<section class="bg-stone-50 py-14 sm:py-20">
  <div class="container-site">
    <div class="mx-auto max-w-2xl text-center">
      <p class="eyebrow">Ownership</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Meet the owners</h2>
      <p class="mt-4 text-stone-600">Locally owned and operated. When you call Terra Elemental, you talk to the people who run it.</p>
    </div>
    <div class="mt-12 flex flex-col items-center justify-center gap-12 sm:flex-row sm:gap-20">
      ${TEAM.map((t) => teamAvatar(t, "h-44 w-44 sm:h-52 sm:w-52")).join("")}
    </div>
  </div>
</section>

<section class="py-14 sm:py-20">
  <div class="container-site">
    <div class="max-w-2xl">
      <p class="eyebrow">How it works</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Living soil technology</h2>
      <p class="mt-4 text-stone-600">Our inoculated granules work as a complete soil support system, combining time-release organic nutrients, mineral inputs and a dense, active microbial community.</p>
    </div>
    <ol class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      ${[
        ["Nutrient foundation", "Derived from agricultural byproducts, the organic base provides dense, time-release nutrition for plants and microbes."],
        ["Mineral enrichment", "Potassium sulfate and other minerals supply essential macro- and micronutrients."],
        ["Microbial activation", "Granules are inoculated with beneficial bacteria and fungi that activate when watered in."],
        ["Living soil", "Microbes distribute nutrients, retain water and turn soil into a thriving ecosystem."],
      ].map(([t, d], i) => `<li class="card p-6"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-white">${i + 1}</span><h3 class="mt-4 text-lg font-semibold">${t}</h3><p class="mt-2 text-sm leading-relaxed text-stone-600">${d}</p></li>`).join("\n      ")}
    </ol>
  </div>
</section>

<section class="bg-forest-50 py-14 sm:py-20">
  <div class="container-site grid items-center gap-10 lg:grid-cols-2">
    <img src="assets/img/mycorrhizae.webp" alt="Microscope view of beneficial fungal filaments" class="aspect-[4/3] w-full rounded-3xl object-cover" loading="lazy">
    <div>
      <p class="eyebrow">Our manufacturing partner</p>
      <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">Proven products from Sigma AgriScience</h2>
      <div class="prose-site mt-5">
        <p>Terra Elemental is an authorized distributor of Sigma AgriScience, a leading North American manufacturer of organic granular biofertilizers since 2007. Sigma supplies agriculture, nursery, turf and landscape markets across the U.S. and internationally.</p>
        <p>Sigma's biotechnology is harnessed from nature and never genetically modified. Its proprietary GranCORE process combines humic acid and essential nutrients into a slow-release, easy-to-spread granule infused with beneficial biology.</p>
      </div>
      <a href="products.html" class="btn-dark mt-4">Browse the product line ${icon("arrow", "h-4 w-4")}</a>
    </div>
  </div>
</section>
${ctaBand()}`;
  return layout({
    file: "about.html",
    title: "About",
    active: "about",
    description: "Terra Elemental is a San Luis Valley, Colorado company owned by David Bonilla and Keith Morrison, providing regenerative soil biotechnology and Sigma AgriScience biofertilizers.",
    body,
  });
}

function contactPage() {
  const body = `
${pageHeader({ eyebrow: "Contact", title: "Let's talk about your sites", lede: "Request a quote, ask for product documentation, or set up a program for next season. We usually reply within one business day.", image: "assets/img/turf-plug.webp" })}

<section class="py-12 sm:py-16">
  <div class="container-site grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
    <div id="quote" class="card p-6 sm:p-8">
      <h2 class="text-2xl font-semibold">Request a quote</h2>
      <p class="mt-1 text-sm text-stone-600">Fields marked * are required.</p>
      <div class="mt-6 hidden rounded-2xl bg-field-50 p-6 ring-1 ring-field-100" data-form-success role="status" tabindex="-1">
        <span class="flex h-11 w-11 items-center justify-center rounded-full bg-field-600 text-white">${icon("check", "h-5 w-5")}</span>
        <h3 class="mt-4 text-xl font-semibold">Thanks, your request is on its way</h3>
        <p class="mt-1 text-sm text-stone-700">We'll get back to you within one business day. For anything urgent, call ${SITE.phone}.</p>
      </div>
      <form class="mt-6 grid gap-5 sm:grid-cols-2" data-quote-form data-access-key="${SITE.formAccessKey}" novalidate>
        <input type="checkbox" name="botcheck" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div><label class="field-label" for="f-name">Name *</label><input class="field-input" id="f-name" name="name" autocomplete="name" required></div>
        <div><label class="field-label" for="f-org">Organization</label><input class="field-input" id="f-org" name="organization" autocomplete="organization" placeholder="e.g. City Parks & Recreation"></div>
        <div><label class="field-label" for="f-email">Email *</label><input class="field-input" id="f-email" name="email" type="email" autocomplete="email" required></div>
        <div><label class="field-label" for="f-phone">Phone</label><input class="field-input" id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
        <div>
          <label class="field-label" for="f-type">Type of site</label>
          <select class="field-input" id="f-type" name="site">
            <option value="">Select one</option>
            <option>Parks &amp; open space</option><option>Athletic fields</option><option>Landscape, trees &amp; beds</option>
            <option>Golf course</option><option>Farm or ranch</option><option>Restoration / reclamation</option><option>Other</option>
          </select>
        </div>
        <div><label class="field-label" for="f-area">Approximate area</label><input class="field-input" id="f-area" name="area" placeholder="e.g. 40 acres or 250,000 sq ft"></div>
        <div class="sm:col-span-2">
          <label class="field-label" for="f-product">Product of interest</label>
          <select class="field-input" id="f-product" name="product">
            <option value="">Not sure, please recommend</option>
            ${LINES.map((l) => `<optgroup label="${l.label}">${PRODUCTS.filter((p) => p.line === l.id).map((p) => `<option value="${p.slug}">${esc(p.name)}</option>`).join("")}</optgroup>`).join("\n            ")}
          </select>
        </div>
        <div class="sm:col-span-2"><label class="field-label" for="f-msg">Message</label><textarea class="field-input min-h-[8rem]" id="f-msg" name="message" placeholder="Timing, delivery location, packaging (bags, totes, bulk), documentation needed…"></textarea></div>
        <p class="hidden rounded-lg bg-red-50 p-3 text-sm text-red-800 sm:col-span-2" data-form-error role="alert"></p>
        <div class="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-stone-500">${SITE.formAccessKey ? `Your request goes straight to our team. You can also email ${SITE.email}.` : `Submitting opens a pre-filled email to ${SITE.email} in your email app.`}</p>
          <button type="submit" class="btn-primary disabled:cursor-wait disabled:opacity-70" data-submit>Send request ${icon("arrow", "h-4 w-4")}</button>
        </div>
      </form>
    </div>

    <aside class="space-y-5">
      <div class="card p-6">
        <h2 class="text-xl font-semibold">Reach us directly</h2>
        <ul class="mt-5 space-y-5 text-sm">
          <li class="flex gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-800">${icon("mail")}</span><div><p class="font-semibold text-forest-950">Email</p><a href="mailto:${SITE.email}" class="text-field-700 hover:underline">${SITE.email}</a></div></li>
          <li class="flex gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-800">${icon("phone")}</span><div><p class="font-semibold text-forest-950">Phone</p><a href="tel:${SITE.phoneHref}" class="text-field-700 hover:underline">${SITE.phone}</a></div></li>
          <li class="flex gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-800">${icon("pin")}</span><div><p class="font-semibold text-forest-950">Service area</p><p class="text-stone-600">${SITE.region}</p></div></li>
        </ul>
      </div>
      <div class="card bg-forest-900 p-6 text-forest-100">
        <h2 class="text-xl font-semibold !text-white">For procurement teams</h2>
        <p class="mt-2 text-sm leading-relaxed">We can provide product labels, safety data sheets and OMRI certificates with your quote. Most are also downloadable from each product page.</p>
        <a href="products.html" class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sun-300 hover:text-sun-400">Browse product documents ${icon("arrow", "h-4 w-4")}</a>
      </div>
      <div class="card p-6">
        <h2 class="text-xl font-semibold">Budgeting first?</h2>
        <p class="mt-2 text-sm text-stone-600">Get bag counts and costs for your acreage before you reach out.</p>
        <a href="calculator.html" class="btn-outline mt-4 w-full">${icon("calc", "h-4 w-4")}Open the Cost Calculator</a>
      </div>
    </aside>
  </div>
</section>`;
  return layout({
    file: "contact.html",
    title: "Contact & Quotes",
    active: "contact",
    description: "Contact Terra Elemental for quotes, product documentation and biological fertility programs for parks, athletic fields and landscapes in Southern Colorado.",
    body,
    scripts: [],
  });
}

function calculatorPage() {
  const seg = "rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition aria-pressed:bg-white aria-pressed:text-forest-950 aria-pressed:shadow-sm";
  const stat = (id, label, val) => `<div class="rounded-xl bg-stone-100 px-4 py-3"><p class="text-xs text-stone-600">${label}</p><p class="mt-0.5 text-lg font-semibold tabular-nums text-forest-950" id="${id}">${val}</p></div>`;
  const body = `
<section class="border-b border-stone-200 bg-gradient-to-b from-forest-50 to-white">
  <div class="container-site py-10 sm:py-14">
    <p class="eyebrow">Planning tool</p>
    <h1 class="mt-2 text-3xl font-semibold sm:text-5xl">Fertilizer Cost Calculator</h1>
    <p class="mt-3 max-w-2xl text-stone-600 sm:text-lg">Choose a Sigma AgriScience product and enter the area you're treating. We'll work out how many 50&nbsp;lb bags you need and what it costs at wholesale pricing.</p>
    <a href="${PRICE_PDF}" class="btn-outline mt-6" download>${icon("download", "h-4 w-4")}Pricing at a Glance (PDF)</a>
  </div>
</section>

<section class="py-8 sm:py-12">
  <div class="container-site">
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card p-5 sm:p-7" aria-labelledby="in-h">
        <h2 id="in-h" class="text-xl font-semibold">Your project</h2>

        <div class="mt-5">
          <label for="product" class="field-label">Product</label>
          <select id="product" class="field-input"></select>
          <div class="mt-3 flex flex-wrap gap-2" id="meta"></div>
        </div>

        <div class="mt-6">
          <label for="area" class="field-label">Area to treat</label>
          <div class="flex gap-2">
            <input id="area" type="number" inputmode="decimal" min="0" step="any" value="10" class="field-input min-w-0 flex-1">
            <div class="inline-flex shrink-0 rounded-lg bg-stone-100 p-1" id="unit-seg" role="group" aria-label="Area unit">
              <button type="button" data-unit="acres" aria-pressed="true" class="${seg}">Acres</button>
              <button type="button" data-unit="sqft" aria-pressed="false" class="${seg}">Sq ft</button>
            </div>
          </div>
          <p class="mt-1.5 text-sm text-stone-500" id="area-hint"></p>
        </div>

        <div class="mt-6">
          <p class="field-label" id="n-label">Nitrogen rate per application</p>
          <div class="grid grid-cols-3 gap-1 rounded-lg bg-stone-100 p-1" id="n-seg" role="group" aria-labelledby="n-label">
            ${[["0.25", "Low"], ["0.5", "Medium"], ["1", "High"]].map(([n, l]) => `<button type="button" data-n="${n}" aria-pressed="${n === "1"}" class="${seg} py-2.5"><span class="block">${l}</span><span class="block text-xs font-normal opacity-75">${n} lb N</span></button>`).join("\n            ")}
          </div>
          <p class="mt-1.5 text-sm text-stone-500">Pounds of nitrogen (N) per 1,000 sq ft. Product rates scale to deliver this amount.</p>
        </div>

        <div class="mt-6">
          <label for="apps" class="field-label">Applications per season</label>
          <input id="apps" type="number" inputmode="numeric" min="1" step="1" value="1" class="field-input">
        </div>
      </div>

      <div class="card p-5 sm:p-7 lg:sticky lg:top-28 lg:self-start" aria-labelledby="out-h" aria-live="polite">
        <h2 id="out-h" class="text-xl font-semibold">Your estimate</h2>
        <div class="mt-5 rounded-2xl bg-forest-900 p-5 text-white sm:p-6">
          <p class="text-sm text-forest-200">Estimated order total</p>
          <p class="mt-1 font-serif text-4xl font-semibold tabular-nums sm:text-5xl" id="total">$0.00</p>
          <p class="mt-2 text-sm text-forest-100" id="total-sub"></p>
        </div>
        <p id="bridge-note" class="mt-4 hidden rounded-xl bg-sun-300/30 p-4 text-sm text-forest-950 ring-1 ring-sun-400/60" role="note"><strong class="font-semibold">Custom pricing:</strong> <span data-bridge-text></span> <a href="contact.html#quote" class="font-semibold underline">Request current price</a></p>
        <div class="mt-4 grid grid-cols-2 gap-3">
          ${stat("bags", "50 lb bags to order", "0")}
          ${stat("weight", "Product weight", "0 lbs")}
          ${stat("per-bag", "Price per bag", "$0.00")}
          ${stat("per-ton", "Price per ton (40 bags)", "$0.00")}
          ${stat("per-acre", "Cost per acre", "$0.00")}
          ${stat("per-k", "Cost per 1,000 sq ft", "$0.00")}
        </div>
        <div class="mt-5 flex flex-col gap-3 sm:flex-row">
          <a class="btn-primary flex-1" id="quote" href="mailto:${SITE.email}">${icon("mail", "h-4 w-4")}Email this estimate</a>
          <a class="btn-outline flex-1" id="product-link" href="products.html">View product</a>
        </div>
      </div>
    </div>

    <div class="card mt-6 p-5 sm:p-7" aria-labelledby="cmp-h">
      <div class="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <h2 id="cmp-h" class="text-xl font-semibold">Compare all products for your area</h2>
        <p class="text-sm text-stone-500">Tap a row to select it.</p>
      </div>
      <div class="-mx-5 mt-4 overflow-x-auto sm:mx-0">
        <table class="w-full min-w-[640px] text-sm tabular-nums">
          <thead>
            <tr class="border-b border-stone-200 text-xs text-stone-500">
              <th scope="col" class="py-2.5 pl-5 pr-3 text-left font-medium sm:pl-0">Product</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Rate / 1,000 sq ft</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Bags / acre</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Cost / acre</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Cost / 1,000 sq ft</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">Bags to order</th>
              <th scope="col" class="py-2.5 pl-3 pr-5 text-right font-medium sm:pr-0">Total</th>
            </tr>
          </thead>
          <tbody id="cmp"></tbody>
        </table>
      </div>
      <p class="mt-4 text-xs text-stone-500">* Bridge products require custom pricing because input costs fluctuate. Figures use the most recent prices and are subject to change.</p>
    </div>

    <p class="mt-6 max-w-3xl text-sm text-stone-500">Estimates use wholesale pricing per ton (40 × 50&nbsp;lb bags) and round up to whole bags. Cost per acre and per 1,000&nbsp;sq&nbsp;ft are based on exact product use. Prices are subject to change; shipping and tax are not included. <a href="contact.html#quote" class="font-medium text-field-700 underline">Contact us</a> for a formal quote.</p>
  </div>
</section>

<dialog id="bridge-dialog" aria-labelledby="bridge-dialog-title" class="w-[calc(100%-2rem)] max-w-lg rounded-2xl p-0 shadow-2xl backdrop:bg-forest-950/60">
  <form method="dialog" class="p-6 sm:p-7">
    <div class="flex items-start gap-4">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun-300/50 text-forest-950">${icon("calc")}</span>
      <div>
        <h2 id="bridge-dialog-title" class="text-xl font-semibold">Bridge products: custom pricing</h2>
        <p class="mt-2 text-sm leading-relaxed text-stone-700" data-bridge-text></p>
      </div>
    </div>
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <a href="contact.html#quote" class="btn-outline">Inquire for current price</a>
      <button class="btn-primary" autofocus>Continue to estimate</button>
    </div>
  </form>
</dialog>`;
  return layout({
    file: "calculator.html",
    title: "Fertilizer Cost Calculator",
    active: "calculator",
    description: "Estimate how many 50 lb bags of Sigma AgriScience fertilizer you need and what it will cost for your acreage or square footage.",
    body,
    scripts: ["assets/js/pricing-data.js", "assets/js/calculator.js"],
  });
}

function notFound() {
  const body = `
<section class="py-24">
  <div class="container-site text-center">
    <p class="eyebrow">404</p>
    <h1 class="mt-3 text-4xl font-semibold">We couldn't find that page</h1>
    <p class="mt-3 text-stone-600">It may have moved. Try one of these instead.</p>
    <div class="mt-8 flex flex-wrap justify-center gap-3"><a href="/index.html" class="btn-primary">Home</a><a href="/products.html" class="btn-outline">Products</a><a href="/calculator.html" class="btn-outline">Cost Calculator</a></div>
  </div>
</section>`;
  return layout({ file: "404.html", title: "Page not found", active: "", description: "Page not found.", body });
}

function pricingSheet() {
  const usd = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const priceBySlug = Object.fromEntries(PRICING.products.filter((x) => x.slug).map((x) => [x.slug, x]));
  const logo = path.join(OUT, "assets/img/logo-lockup.png").split(path.sep).join("/");
  const row = (p, cells) =>
    `<tr><td class="name">${esc(p.name)}${p.omri ? ' <span class="omri">OMRI</span>' : ""}</td><td>${p.npk || "72% SiO₂"}</td>${cells}</tr>`;
  const rows = LINES.map((l) => {
    const items = PRODUCTS.filter((p) => p.line === l.id).map((p) => {
      const pr = priceBySlug[p.slug];
      const rate = `<td class="num">${pr ? `${pr.rate} lb` : "—"}</td>`;
      if (p.line === "bridge" || pr?.bridge) return row(p, `${rate}<td colspan="2" class="quote">Contact for custom quote</td>`);
      if (!pr) return row(p, `${rate}<td colspan="2" class="quote">Contact for pricing</td>`);
      return row(p, `${rate}<td class="num">${usd(pr.ton / 40)}</td><td class="num">${usd(pr.ton)}</td>`);
    });
    return `<tr class="group"><td colspan="5">${l.label}</td></tr>${items.join("")}`;
  }).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Terra Elemental Pricing at a Glance</title>
<style>
  @page { size: Letter; margin: 0.5in 0.55in; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10pt/1.35 "Segoe UI", Arial, sans-serif; color: #1c2a20; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #183022; padding-bottom: 10px; }
  header img { height: 54px; }
  header .t { text-align: right; }
  h1 { margin: 0; font: 600 20pt Georgia, serif; color: #0d1d14; }
  .sub { color: #5b6657; font-size: 9pt; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th { text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .05em; color: #5b6657; font-weight: 600; padding: 6px 8px; border-bottom: 1.5px solid #c3d9c9; }
  th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td { padding: 6px 8px; border-bottom: 1px solid #e4e8e2; }
  tr.group td { background: #183022; color: #fff; font-weight: 600; font-size: 9pt; letter-spacing: .03em; padding: 5px 8px; border: 0; }
  td.name { font-weight: 600; }
  td.quote { text-align: right; color: #22659a; font-weight: 600; font-style: italic; }
  .omri { display: inline-block; font-size: 6.5pt; font-weight: 700; letter-spacing: .06em; color: #028a19; border: 1px solid #028a19; border-radius: 3px; padding: 0 3px; margin-left: 4px; vertical-align: 1px; }
  .notes { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 8.5pt; color: #3d4a3f; }
  .notes h2 { font: 600 10pt Georgia, serif; margin: 0 0 4px; color: #0d1d14; }
  .notes ul { margin: 0; padding-left: 14px; }
  .notes li { margin-bottom: 2px; }
  footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #c3d9c9; display: flex; justify-content: space-between; font-size: 9pt; }
  footer b { color: #0d1d14; }
</style></head><body>
<header>
  <img src="file:///${logo}" alt="Terra Elemental">
  <div class="t"><h1>Pricing at a Glance</h1><div class="sub">Sigma AgriScience organic biofertilizers · Effective ${PRICING.effective}</div></div>
</header>
<table>
  <thead><tr><th>Product</th><th>Analysis</th><th class="num">Rate / 1,000 sq ft*</th><th class="num">Per 50 lb bag</th><th class="num">Per ton (40 bags)</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="notes">
  <div>
    <h2>About this pricing</h2>
    <ul>
      <li>Wholesale prices. Shipping and tax are not included.</li>
      <li>Bridge products require custom pricing due to fluctuating input costs.</li>
      <li>Prices are subject to change. Contact us for a formal quote.</li>
    </ul>
  </div>
  <div>
    <h2>Good to know</h2>
    <ul>
      <li>*Product rate to deliver 1 lb N per 1,000 sq ft. Scale down for lower N targets.</li>
      <li>Available in 50 lb bags, 2,000 lb totes and bulk loads.</li>
      <li>Estimate your order online at terraelemental.org/calculator.html</li>
    </ul>
  </div>
</div>
<footer>
  <div><b>Terra Elemental</b> · ${SITE.region}</div>
  <div><b>${SITE.email}</b> · ${SITE.phone} · terraelemental.org</div>
</footer>
</body></html>`;
}

// ---------- write ----------
const pages = {
  "index.html": home(),
  "products.html": productsPage(),
  "solutions.html": solutionsPage(),
  "about.html": aboutPage(),
  "contact.html": contactPage(),
  "calculator.html": calculatorPage(),
  "404.html": notFound(),
};
for (const p of PRODUCTS) pages[`products/${p.slug}.html`] = productPage(p);

for (const [file, html] of Object.entries(pages)) {
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

const urls = Object.keys(pages).filter((f) => f !== "404.html").map((f) => `  <url><loc>${SITE.url}/${f === "index.html" ? "" : f}</loc></url>`);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

// Shared pricing for the calculator.
fs.writeFileSync(path.join(OUT, "assets/js/pricing-data.js"), `// Generated from src/data/pricing.json by src/build.mjs. Do not edit.\nwindow.TE_PRICING = ${JSON.stringify(PRICING)};\n`);

// One-page "Pricing at a Glance" sheet, rendered to PDF by scripts/render-pdf.mjs (npm run build:pdf).
fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "build/pricing-sheet.html"), pricingSheet());
console.log(`Built ${Object.keys(pages).length} pages.`);
