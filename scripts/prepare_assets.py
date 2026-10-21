"""One-time asset preparation for the Terra Elemental site.

Reads the Sigma AgriScience scrape and the Terra Elemental logo files, then writes:
  - docs/assets/img/...        optimized photos, product bag images and logos
  - docs/assets/docs/<slug>/   product labels, SDS sheets and flyers
  - src/data/products.json     normalized product data used by src/build.mjs

Usage:
  python scripts/prepare_assets.py <SigmaScrape dir> <logo-full.png> <logo-mark.png>
"""
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_IMG = ROOT / "docs" / "assets" / "img"
OUT_DOCS = ROOT / "docs" / "assets" / "docs"
OUT_DATA = ROOT / "src" / "data" / "products.json"

# folder -> (slug, product line, short name, calculator name)
PRODUCTS = {
    "01_Sigma-2-4-2-Bio": ("sigma-2-4-2-bio", "agriculture", "Sigma 2-4-2 Bio 2x", "OMRI Sigma 2-4-2 Bio 2x"),
    "02_Sigma-4-4-4-Bio": ("sigma-4-4-4-bio", "agriculture", "Sigma 4-4-4 Bio", "OMRI Sigma 4-4-4 Bio"),
    "03_Sigma-5-3-2-Bio": ("sigma-5-3-2-bio", "agriculture", "Sigma 5-3-2 Bio", "OMRI Sigma 5-3-2 Bio"),
    "04_Sigma-6-2-6-Bio": ("sigma-6-2-6-bio", "agriculture", "Sigma 6-2-6 Bio", "OMRI Sigma 6-2-6 Bio"),
    "05_Sigma-7-2-1-Bio": ("sigma-7-2-1-bio", "agriculture", "Sigma 7-2-1 Bio", "OMRI Sigma 7-2-1 Bio"),
    "06_Sigma-8-5-1-Bio": ("sigma-8-5-1-bio", "agriculture", "Sigma 8-5-1 Bio", "OMRI Sigma 8-5-1 Bio"),
    "07_Sigma-4-4-4-Bio-Fine": ("sigma-4-4-4-bio-fine", "specialty", "Sigma 4-4-4 Bio Fine Grade", "OMRI Sigma 4-4-4 Bio Fine"),
    "08_Sigma-4-3-2-Bio-Fine": ("sigma-4-3-2-bio-fine", "specialty", "Sigma 4-3-2 Bio 2x Fine Grade", None),
    "09_Sigma-5-3-2-Bio-Fine": ("sigma-5-3-2-bio-fine", "specialty", "Sigma 5-3-2 Bio Fine Grade", "OMRI Sigma 5-3-2 Bio Fine"),
    "10_Sigma-6-2-6-Bio-Fine": ("sigma-6-2-6-bio-fine", "specialty", "Sigma 6-2-6 Bio Fine Grade", "OMRI Sigma 6-2-6 Bio Fine"),
    "11_Sigma-12-2-6-BRIDGE": ("sigma-12-2-6-bio-bridge", "bridge", "Sigma 12-2-6 Bio Bridge", "Sigma 12-2-6 BRIDGE"),
    "12_Sigma-15-5-10-BRIDGE": ("sigma-15-5-10-bio-bridge", "bridge", "Sigma 15-5-10 Bio Bridge", "Sigma 15-5-10 BRIDGE"),
    "13_Sigma-Si": ("sigma-si", "amendment", "Sigma Si (Silica)", None),
}

# Descriptions rewritten lightly (typos fixed, line breaks removed) where the scraped copy needed it.
DESCRIPTION_OVERRIDES = {
    "sigma-4-3-2-bio-fine": (
        "Sigma's 4-3-2 Bio formula with twice the concentration of value-added biologicals, "
        "produced in a fine (specialty) grade for turf, athletic fields and landscape beds. "
        "The label, SDS and full guaranteed analysis are available from Terra Elemental on request."
    ),
    "sigma-4-4-4-bio-fine": (
        "This premium micro-granular fertilizer has a size grade number (SGN) of 110 and contains 100% organic, "
        "nutrient-rich ingredients infused with value-added biologicals. Humic acids and beneficial microorganisms "
        "work together to strengthen roots for greater absorption of water and nutrients. Recommended for spring "
        "and fall aeration recovery, midsummer stress management, winter dormant feeding, cool-season overseeding "
        "nutrition and warm-season transition."
    ),
    "sigma-si": (
        "Energize your soil with Sigma Si, a natural source of plant-available silicon that improves soil and "
        "strengthens plants, which can result in higher yields and more resilient turf. Mined from unprocessed "
        "volcanic tuff, it can be applied on its own or blended as a 10% inclusion with other Sigma granular products."
    ),
}

SUBTITLE_OVERRIDES = {
    "sigma-si": "Plant-available silicon from volcanic minerals",
    "sigma-4-3-2-bio-fine": "With Twice the Value-Added Biologicals",
    "sigma-2-4-2-bio": "With Twice the Value-Added Biologicals",
}

LINE_LABELS = {
    "agriculture": "Agriculture · Large Grade",
    "specialty": "Specialty · Fine Grade",
    "bridge": "Bio Bridge · Hybrid",
    "amendment": "Soil Amendment",
}

DOC_LABELS = {
    "Label": "Product Label",
    "SDS": "Safety Data Sheet (SDS)",
    "FLYER": "Product Flyer",
    "OMRI": "OMRI Listing Certificate",
}

# Section-level text fixes for typos in the scraped copy.
TEXT_FIXES = {
    "priorto": "prior to",
    "microroganism": "microorganism",
    "accid": "acid",
    "( Mg)": "(Mg)",
}


def clean(text):
    text = re.sub(r"\s*\n\s*", " ", text or "")
    text = re.sub(r"\s{2,}", " ", text).strip()
    for bad, good in TEXT_FIXES.items():
        text = text.replace(bad, good)
    return text


def save_webp(src, dest, max_w, max_h=None, quality=80):
    im = Image.open(src)
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    im.thumbnail((max_w, max_h or 10_000), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    return im.size


def parse_sections(sections):
    out = {"analysis": [], "derived": "", "notes": [], "biologicals": [], "rates": [], "containers": [], "features": []}
    for sec in sections or []:
        heading = sec.get("heading", "")
        content = sec.get("content", [])
        if heading == "Guaranteed Analysis":
            tables = [c["table"] for c in content if "table" in c]
            if tables:
                out["analysis"] = [{"item": clean(r["item"]), "value": clean(r["value"]), "sub": bool(r.get("sub_item"))} for r in tables[0]]
            if len(tables) > 1:
                out["biologicals"] = [{"item": clean(r["item"]), "value": clean(r["value"])} for r in tables[1]]
            for c in content:
                if "text" in c:
                    t = clean(c["text"])
                    if t.lower().startswith("derived"):
                        out["derived"] = t
                    else:
                        out["notes"].append(t)
        elif heading == "Container Sizes":
            rows = content[0]["table"] if content and "table" in content[0] else []
            size = None
            for r in rows:
                if r.get("sub_item"):
                    size = clean(r["value"]).rstrip(":")
                elif size:
                    low = clean(r["item"]).replace("Low Rate:", "").strip()
                    high = clean(r["value"]).replace("High Rate:", "").strip()
                    out["containers"].append({"size": size, "low": low, "high": high})
                    size = None
        elif heading == "Slow Release Formula":
            out["features"].append({"heading": heading, "text": " ".join(clean(c.get("text", "")) for c in content)})
        else:
            intro = ""
            rows = []
            for c in content:
                if "label" in c:
                    rows.append({"label": clean(c["label"]).rstrip(":"), "text": clean(c["text"])})
                elif "text" in c:
                    intro = clean(c["text"])
            if rows or intro:
                out["rates"].append({"heading": heading, "intro": intro, "rows": rows})
    return out


def main(scrape, logo_full, logo_mark):
    scrape = Path(scrape)
    products = []
    for folder, (slug, line, name, calc_name) in PRODUCTS.items():
        src = scrape / "products" / folder
        p = json.loads((src / "product.json").read_text(encoding="utf-8"))
        npk = re.search(r"\d+-\d+-\d+", name)
        sec = parse_sections(p.get("sections"))

        image = None
        imgs = [i["file"] for i in p.get("images", []) if not re.search(r"cdfa|sigma-bridge|sigma-organic|cmngsoon", i["file"])]
        if imgs:
            image = f"assets/img/products/{slug}.webp"
            save_webp(src / imgs[0], ROOT / "docs" / image, 900, 900, quality=82)

        docs = []
        for d in p.get("documents", []):
            if d.get("file"):
                dest = OUT_DOCS / slug / Path(d["file"]).name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src / d["file"], dest)
                docs.append({"type": d["type"], "label": DOC_LABELS.get(d["type"], d["type"]),
                             "href": f"assets/docs/{slug}/{dest.name}", "size": dest.stat().st_size})
            else:
                docs.append({"type": d["type"], "label": DOC_LABELS.get(d["type"], d["type"]), "href": d["url"], "external": True})

        products.append({
            "slug": slug,
            "name": name,
            "npk": npk.group(0) if npk else None,
            "line": line,
            "lineLabel": LINE_LABELS[line],
            "subtitle": SUBTITLE_OVERRIDES.get(slug, clean(p.get("subtitle", ""))),
            "description": DESCRIPTION_OVERRIDES.get(slug, clean(p.get("description", ""))),
            "omri": any(d["type"] == "OMRI" for d in docs),
            "packaging": ["50 lb poly bag (22.68 kg)", "2,000 lb tote (907 kg)", "Bulk load"],
            "image": image,
            "docs": docs,
            "calcName": calc_name,
            "placeholder": not p.get("sections"),
            **sec,
        })

    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    OUT_DATA.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")

    # Site photography (Sigma AgriScience assets, used with permission).
    photos = scrape / "general_site" / "assets" / "2021" / "11"
    for name, out, w in [
        ("banner.jpg", "hero-park.webp", 1920),
        ("contact-banner.jpg", "city-park.webp", 1920),
        ("sports.jpg", "athletic-field.webp", 1600),
        ("sports-05.jpg", "root-mass.webp", 900),
        ("sports-2.jpg", "turf-plug.webp", 900),
        ("golf-heading.jpg", "golf.webp", 1600),
        ("landscape.jpg", "landscape.webp", 1600),
        ("header.jpg", "agriculture.webp", 1600),
        ("h2.jpg", "sod-farm.webp", 1600),
        ("Sigma444Bio-new.jpg", "granules.webp", 900),
        ("beneficial-fungi-1.jpg", "mycorrhizae.webp", 900),
        ("Biostimulants-header.jpg", "seedling.webp", 1600),
        ("organic-fertilizer-growing-turf.png", "turf-ribbons.webp", 900),
    ]:
        save_webp(photos / name, OUT_IMG / out, w, quality=76)

    # Logos: full stacked logo, mark only, and a horizontal lockup built from the logo's own lettering.
    full = Image.open(logo_full).convert("RGBA")
    mark = Image.open(logo_mark).convert("RGBA")
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    full.resize((540, 540), Image.LANCZOS).save(OUT_IMG / "logo-full.png", optimize=True)
    mark.save(OUT_IMG / "logo-mark.png", optimize=True)
    for size, fname in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")]:
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0 if size == 32 else 255))
        m = mark.copy()
        pad = 0 if size == 32 else size // 10
        m.thumbnail((size - 2 * pad, size - 2 * pad), Image.LANCZOS)
        canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
        canvas.save(ROOT / "docs" / fname if fname != "icon-512.png" else OUT_IMG / fname, optimize=True)

    def crop_text(box):
        region = full.crop(box)
        return region.crop(region.getbbox())

    terra = crop_text((0, 200, 1080, 300))
    elemental = crop_text((0, 775, 1080, 880))
    gap = int(terra.height * 0.35)
    text_w = max(terra.width, elemental.width)
    text_h = terra.height + elemental.height + gap
    mark_h = int(text_h / 0.62)

    def build_lockup(mark_img, lettering_rgb):
        m = mark_img.resize((int(mark_img.width * mark_h / mark_img.height), mark_h), Image.LANCZOS)
        lockup = Image.new("RGBA", (m.width + int(mark_h * 0.18) + text_w, mark_h), (0, 0, 0, 0))
        lockup.alpha_composite(m, (0, 0))
        x = m.width + int(mark_h * 0.18)
        y = (mark_h - text_h) // 2
        lockup.alpha_composite(recolor(terra, lettering_rgb), (x + (elemental.width - terra.width) // 2, y))
        lockup.alpha_composite(recolor(elemental, lettering_rgb), (x, y + terra.height + gap))
        lockup.thumbnail((1000, 300), Image.LANCZOS)
        return lockup

    def recolor(img, rgb):
        if rgb is None:
            return img
        solid = Image.new("RGBA", img.size, rgb + (255,))
        solid.putalpha(img.getchannel("A"))
        return solid

    build_lockup(mark, None).save(OUT_IMG / "logo-lockup.png", optimize=True)

    # Variant for dark backgrounds: white lettering, and the mark on a white hexagon so its colors still read.
    from PIL import ImageDraw
    backed = Image.new("RGBA", mark.size, (0, 0, 0, 0))
    w, h = mark.size
    ImageDraw.Draw(backed).polygon([(w / 2, 2), (w - 3, h * 0.25), (w - 3, h * 0.75), (w / 2, h - 2), (3, h * 0.75), (3, h * 0.25)], fill=(255, 255, 255, 255))
    backed.alpha_composite(mark)
    build_lockup(backed, (255, 255, 255)).save(OUT_IMG / "logo-lockup-light.png", optimize=True)
    print(f"Wrote {len(products)} products, photos and logos.")


if __name__ == "__main__":
    main(*sys.argv[1:4])
