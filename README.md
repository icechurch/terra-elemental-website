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
| About / owners | `docs/about.html` |
| Contact & quote request (`?product=<slug>` prefills the form) | `docs/contact.html` |

## Editing

The HTML in `docs/` is **generated**, so edit the sources and rebuild:

- `src/build.mjs`: page layouts, copy, navigation, contact details (the `SITE` object) and owners (`TEAM`)
- `src/data/products.json`: product data (descriptions, analysis, rates, documents)
- `src/styles.css` and `tailwind.config.js`: brand colors, fonts, shared component classes
- `src/data/pricing.json`: wholesale prices and rates. Feeds both the calculator and the Pricing at a Glance PDF; update the `effective` date when prices change
- `docs/assets/js/calculator.js`: calculator math and the Bridge custom-pricing notice (hand-written)
- `docs/assets/js/main.js`: mobile menu, product filter, quote form

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

## Quote form

The quote form posts to [Web3Forms](https://web3forms.com), which emails each submission to the address the access key was created for. Visitors stay on the page and see a confirmation. Spam is filtered with a hidden honeypot field.

To turn it on, create a free access key at web3forms.com using the inbox that should receive requests, paste it into `formAccessKey` in the `SITE` object in `src/build.mjs`, and run `npm run build`. The key is designed to be public, so it's safe in the page source. Until a key is set, the form opens a pre-filled email to info@terraelemental.org instead.

## Deploying on GitHub Pages

Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, Folder: `/docs`. For the custom domain, add `terraelemental.org` under Pages and update DNS. The site already uses `https://terraelemental.org` for its canonical URLs and sitemap.
