# Terra Elemental website

Static marketing site for Terra Elemental, a San Luis Valley, Colorado distributor of Sigma AgriScience organic biofertilizers. It's built with Tailwind CSS and a small Node page generator, has no runtime dependencies, and can be hosted on GitHub Pages straight from `docs/`.

## Pages

| Page | File |
|---|---|
| Home | `docs/index.html` |
| Products (filterable by line, `?line=specialty`) | `docs/products.html` |
| Product detail (13 pages) | `docs/products/<slug>.html` |
| Solutions (parks, athletic fields, landscape, golf, agriculture) | `docs/solutions.html` |
| Cost Calculator (`?product=<slug>` preselects a product) | `docs/calculator.html` |
| The Science (plain-language summary up top, tabbed deep dive below; `#biology`, `#carbon`, `#nitrogen`, `#quality`, `#research` open a tab) | `docs/science.html` |
| Field Results (filterable photo and video gallery with an agronomy note for each) | `docs/field-results.html` |
| About / owners | `docs/about.html` |
| Contact & quote request (`?product=<slug>` prefills the form) | `docs/contact.html` |

## Editing

The HTML in `docs/` is **generated**, so edit the sources and rebuild:

- `src/build.mjs`: page layouts, copy, navigation, contact details (the `SITE` object) and owners (`TEAM`)
- `src/data/products.json`: product data (descriptions, analysis, rates, documents)
- `src/styles.css` and `tailwind.config.js`: brand colors, fonts, shared component classes
- `src/data/pricing.json`: wholesale prices and rates. Feeds both the calculator and the Pricing at a Glance PDF; update the `effective` date when prices change
- `docs/assets/js/calculator.js`: calculator math for all six application types and the Bridge custom-pricing notice (hand-written). Turf uses the N-based rates in `pricing.json`; beds, crops, containers, potting media and trees use the label rates parsed from `products.json` by `applicationRates()` in `src/build.mjs`
- `src/data/science.json` and `src/data/field.json`: strains, research cards, outside resources and field files for the Science and Field Results pages. Microbe counts, humic acids and the nitrogen chart on the Science page come from `products.json` (the labels), not this file
- `docs/assets/js/main.js`: mobile menu, product filter, science tabs, field results gallery, quote form

```bash
npm install
npm run build
```

`npm run build` also renders `docs/assets/docs/terra-elemental-pricing.pdf` with a locally installed Chrome or Edge (set `CHROME_PATH` if it isn't found).

Preview locally with `python -m http.server 8080 --directory docs`, then open http://localhost:8080.

### Owner photos

Put square photos at `docs/assets/img/team/david-bonilla.jpg` and `docs/assets/img/team/keith-morrison.jpg` (at least 400×400) and run `npm run build`. Both are cropped to matching circles. Until a photo exists, the site shows the owner's initials.

### Product data and images

`scripts/prepare_assets.py` regenerates `src/data/products.json`, optimized images and product PDFs from the Sigma AgriScience scrape:

```bash
python scripts/prepare_assets.py ../SigmaScrape path/to/logo-full.png path/to/logo-mark.png
```

Product text, labels, SDS sheets and images are Sigma AgriScience's, used with permission.

### Science and Field Results content

`scripts/prepare_science_field.py` regenerates `src/data/science.json`, `src/data/field.json`, the field photos (`docs/assets/img/field/`), videos (`docs/assets/video/`) and the Sigma Bio technical brief from the scrape of Sigma's science and field pages. Gallery filter tags and the three featured side-by-side trials are set at the top of the script:

```bash
python scripts/prepare_science_field.py ../SigmaScrape/ag_science_and_field
```

The outside resources (USDA, university and journal publications) are linked, never re-hosted.

## Quote form

The quote form posts to [Web3Forms](https://web3forms.com), which emails each submission to the address the access key was created for. Visitors stay on the page and see a confirmation. Spam is filtered with a hidden honeypot field.

To turn it on, create a free access key at web3forms.com using the inbox that should receive requests, paste it into `formAccessKey` in the `SITE` object in `src/build.mjs`, and run `npm run build`. The key is designed to be public, so it's safe in the page source. Until a key is set, the form opens a pre-filled email to info@terraelemental.org instead.

## Deploying on GitHub Pages

Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, Folder: `/docs`. For the custom domain, add `terraelemental.org` under Pages and update DNS. The site already uses `https://terraelemental.org` for its canonical URLs and sitemap.
