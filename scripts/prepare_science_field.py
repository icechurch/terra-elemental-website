"""Builds the Science and Field Results data and media from the Sigma AgriScience scrape.

    python scripts/prepare_science_field.py ../SigmaScrape/ag_science_and_field

Writes:
  src/data/field.json          field files, adapted to Terra Elemental's voice and tagged for the gallery filter
  src/data/science.json        strains, research cards and outside resources for the Science page
  docs/assets/img/field/       <name>.webp (1400 px long edge) and <name>-sm.webp (640 px wide) for every field photo
  docs/assets/video/           the two field videos, their poster frames and the zucchini captions
  docs/assets/docs/sigma-bio-technical-brief.pdf

Edit the JSON afterwards by hand if you like, but re-running this script overwrites it.
Third-party PDFs in external_resources/ are linked from the page, never copied (Sigma's permission doesn't cover them).
"""
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT.parent / "SigmaScrape" / "ag_science_and_field").resolve()

IMG_OUT = ROOT / "docs/assets/img/field"
VID_OUT = ROOT / "docs/assets/video"
DOC_OUT = ROOT / "docs/assets/docs"
for d in (IMG_OUT, VID_OUT, DOC_OUT):
    d.mkdir(parents=True, exist_ok=True)

# Gallery filters. An item can sit in more than one.
TAGS = {
    "veg": "Vegetables & field crops",
    "tree": "Fruit & tree crops",
    "nursery": "Nursery & transplants",
    "soil": "Roots & soil life",
}
ITEM_TAGS = {
    "f-pineapple-roots": ["tree", "soil"],
    "f-straw-close": ["veg"],
    "f-tom-truss": ["veg"],
    "f-tom-cut": ["veg"],
    "f-tom-coco": ["veg"],
    "f-melon-bed": ["veg"],
    "f-pumpkin": ["veg"],
    "f-fungi-mulch": ["soil"],
    "f-roots-drip": ["soil"],
    "f-graft-plug": ["nursery", "soil"],
    "f-plug-roots": ["nursery", "soil"],
    "f-lettuce-roots": ["veg", "soil"],
    "f-china-demo": ["veg"],
    "f-cole-field": ["veg"],
    "f-arugula": ["veg"],
    "f-potato-hills": ["veg"],
    "f-coffee-cherries": ["tree"],
    "f-coffee-nursery": ["nursery", "tree"],
    "f-coffee-hillside": ["tree"],
    "f-coffee-seedbed": ["nursery", "tree"],
    "f-olive-nursery": ["nursery", "tree"],
    "f-citrus-walk": ["tree"],
    "f-papaya": ["tree"],
    "f-banana-bags": ["tree"],
    "f-rice": ["veg"],
    "f-squash": ["veg"],
    "f-avo-apply": ["tree"],
    "f-avo-granules": ["tree", "soil"],
    "f-avo-flush": ["tree"],
    "f-avo-mycelium": ["tree", "soil"],
    "f-cauliflower": ["veg"],
    "f-cucumber": ["veg"],
    "f-roma-tunnel": ["veg"],
    "f-field-day": ["veg"],
}
# Strongest results lead the gallery; the rest keep Sigma's order.
LEAD = ["f-pineapple-roots", "f-china-demo", "f-squash"]
# Sigma's distributor-recruiting card doesn't belong on a distributor's own site.
SKIP = {"f-sigma-cap"}
# Sigma's copy speaks as Sigma; Terra Elemental is the seller here.
# The site avoids "side by side" wording for these results.
VOICE = [
    ("our standard grades", "Sigma's standard grades"),
    ("Sigma 2-4-2 Bio 2X side by side with controls", "Grown with Sigma 2-4-2 Bio 2X"),
    ("Root check, side-by-side trial", "Root check"),
    ("Demonstration plot beside the control", "Spinach demonstration plot"),
    ("Side-by-side trial, China", "Demonstration plot, China"),
    ("compare programs side by side", "compare programs"),
]


def voice(s):
    for a, b in VOICE:
        s = s.replace(a, b)
    return s


def webp(src, name):
    with Image.open(src) as im:
        im = im.convert("RGB")
        # Full size: longest edge 1400 px, for the detail view. Small: 640 px wide, for the gallery grid.
        full = im.copy()
        full.thumbnail((1400, 1400), Image.LANCZOS)
        full.save(IMG_OUT / f"{name}.webp", "WEBP", quality=74, method=6)
        sm = im.copy()
        if sm.width > 640:
            sm = sm.resize((640, round(sm.height * 640 / sm.width)), Image.LANCZOS)
        sm.save(IMG_OUT / f"{name}-sm.webp", "WEBP", quality=72, method=6)
        return full.width, full.height


field = json.loads((SRC / "field/field.json").read_text(encoding="utf-8"))
items = []
for it in field["items"]:
    jpg = next(f for f in it["files"] if f.endswith(".jpg"))
    name = Path(jpg).stem
    if name in SKIP:
        continue
    w, h = webp(SRC / "field" / jpg, name)
    note = it["agronomy_note"]
    item = {
        "id": name,
        "title": voice(it["title"]),
        "caption": voice(it["caption"]),
        "image": f"assets/img/field/{name}.webp",
        "thumb": f"assets/img/field/{name}-sm.webp",
        "width": w,
        "height": h,
        "tags": ITEM_TAGS[name],
        "stage": voice(note["stage"]),
        "doing": voice(note["what_the_crop_is_doing"]),
        "fits": voice(note["where_sigma_fits"]),
    }
    video = next((f for f in it["files"] if f.endswith(".mp4")), None)
    if video:
        shutil.copy2(SRC / "field" / video, VID_OUT / Path(video).name)
        item["video"] = f"assets/video/{Path(video).name}"
        vtt = SRC / "field/videos" / f"{name}.en.vtt"
        if vtt.exists():
            shutil.copy2(vtt, VID_OUT / vtt.name)
            item["captions"] = f"assets/video/{vtt.name}"
    items.append(item)

items.sort(key=lambda x: LEAD.index(x["id"]) if x["id"] in LEAD else len(LEAD))
(ROOT / "src/data/field.json").write_text(
    json.dumps({"tags": TAGS, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)

# Science page: strains and outside resources straight from the scrape, plus the research cards.
sci = json.loads((SRC / "science/science.json").read_text(encoding="utf-8"))
cites = {c["citation"]: c["url"] for c in sci["citations"]}
RESEARCH = [
    ("+16%", "Biofertilizers · 171 studies", "Average crop yield gain from microbial biofertilizers in a global meta-analysis, rising to +20% in dry climates, with better nitrogen and phosphorus use efficiency.", "Schütz et al. (2018), Frontiers in Plant Science 8:2204"),
    ("+23%", "Mycorrhizae · rainfed crops", "Yield increase from mycorrhizal fungi across 13 rainfed crops (546 paired observations), with shoot biomass up 24% and root biomass up 30%.", "Wu et al. (2022), PeerJ 10:e12861"),
    ("+21%", "Humic substances · 81 studies", "Average increase in root dry weight from humic substances. Response varies by source and rate; leonardite humics sit at the low end of the range.", "Rose et al. (2014), Advances in Agronomy"),
    ("100–300", "Soil carbon · nutrient holding", "Cation exchange capacity of humus in meq per 100 g, compared with 2 to 15 for kaolinite clay and under 2 for sand. Sandy soils rely on organic matter to hold nutrients.", "Cotching, Brown & Lemon, Cations and CEC fact sheet, GRDC"),
    ("60% · 4 wk", "Organic nitrogen release", "Share of feather meal nitrogen that becomes plant-available in 4 weeks (75% by 10 weeks). Poultry litter releases more slowly, about 27% in 4 weeks.", "Sullivan et al. (2019), Oregon State Extension EM 9235"),
    ("+30%", "Soil management · 54 field studies", "Increase in mycorrhizal root colonization from reduced tillage and winter cover crops. Practices that protect soil life protect the inoculum.", "Bowles et al. (2017), Journal of Applied Ecology 54:1785"),
]
RESOURCE_GROUPS = [
    ("Soil health foundations", 4),
    ("Beneficial microbes", 2),
    ("Nitrogen and nutrient management", 4),
    ("Carbon and amendments", 1),
    ("Organic certification", 2),
]
res, i = [], 0
for title, n in RESOURCE_GROUPS:
    res.append({"group": title, "items": sci["resources"][i : i + n]})
    i += n
assert i == len(sci["resources"]), "resource groups no longer match the scrape"

science = {
    "strains": [
        {"name": s["n"], "group": s["g"], "role": s["r"], "value": s["v"], "finding": s["f"], "conditions": s["c"], "source": s["a"], "url": s["u"]}
        for s in sci["strains"]
    ],
    "research": [{"value": v, "topic": t, "text": x, "source": c, "url": cites[c]} for v, t, x, c in RESEARCH],
    "resources": res,
}
(ROOT / "src/data/science.json").write_text(json.dumps(science, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

shutil.copy2(SRC / "science/sigma-bio-technical-brief.pdf", DOC_OUT / "sigma-bio-technical-brief.pdf")
webp(SRC / "science/images/thumb-sigma-bio-brief.jpg", "brief-cover")
print(f"{len(items)} field files, {len(science['strains'])} strains, {len(science['research'])} research cards.")
