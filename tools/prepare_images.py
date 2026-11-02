#!/usr/bin/env python3
"""Normalise the locally downloaded editorial photography into site assets.

Raw images are supplied in `image-search/` by the image-search tool. This script
renames them semantically, composites transparent PNGs onto linen white, applies
a very light warm editorial grade, and writes progressive JPEGs to
`assets/images/`. Nothing is fetched from a CDN at runtime.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "image-search"
OUT = ROOT / "assets" / "images"
OUT.mkdir(parents=True, exist_ok=True)
LINEN = (247, 244, 240)
WARM = (238, 229, 218)

# output name -> raw image-search filename
MAP = {
    # hero / campaign
    "hero-editorial.jpg": "site-pexels-com-fashion-editorial-model--5.jpg",
    "hero-detail.jpg": "site-pexels-com-linen-shirt-woman-close--4.jpg",
    "campaign-wide.jpg": "site-pexels-com-woman-beige-linen-dress--4.jpg",
    "campaign-pair.jpg": "site-pexels-com-fashion-editorial-model--2.jpg",
    "campaign-portrait.jpg": "site-pexels-com-fashion-editorial-model--5.jpg",
    "lookbook-01.jpg": "site-pexels-com-fashion-editorial-model--2.jpg",
    "lookbook-02.jpg": "site-pexels-com-fashion-editorial-model--2.jpg",
    "lookbook-03.jpg": "site-pexels-com-woman-beige-linen-dress--2.jpg",
    "lookbook-04.jpg": "site-pexels-com-woman-beige-tailored-sui-3.jpg",
    "lookbook-05.jpg": "site-pexels-com-woman-silk-cream-slip-dr-5.jpg",
    "lookbook-06.jpg": "site-pexels-com-woman-elegant-occasion-d-5.jpg",

    # category tiles + hover swaps
    "category-fabric.jpg": "site-pexels-com-fashion-fabric-rolls-neu-2.jpg",
    "category-fabric-hover.jpg": "site-pexels-com-linen-shirt-woman-close--2.jpg",
    "category-ready.jpg": "site-pexels-com-woman-beige-tailored-sui-2.jpg",
    "category-ready-hover.jpg": "site-pexels-com-woman-beige-tailored-sui-2.jpg",
    "category-occasion.jpg": "site-pexels-com-woman-elegant-occasion-d-5.jpg",
    "category-occasion-hover.jpg": "site-pexels-com-woman-beige-linen-dress--4.jpg",
    "category-accessories.jpg": "site-pexels-com-neutral-leather-handbag--2.jpg",
    "category-accessories-hover.jpg": "site-pexels-com-silk-scarf-beige-neutral-5.jpg",

    # craft / story
    "story-loom.jpg": "site-pexels-com-loom-weaving-hands-linen-1.jpg",
    "story-weaving.jpg": "site-pexels-com-loom-weaving-hands-linen-2.jpg",
    "story-atelier.jpg": "site-pexels-com-sewing-machine-tailor-ha-2.jpg",
    "story-hands.jpg": "site-pexels-com-sewing-machine-tailor-ha-5.jpg",
    "atelier-rack.jpg": "site-pexels-com-sewing-machine-tailor-ha-2.jpg",
    "atelier-rails.jpg": "site-pexels-com-sewing-machine-tailor-ha-1.jpg",
    "fabric-rolls.jpg": "site-pexels-com-fashion-fabric-rolls-neu-2.jpg",
    "london-street.jpg": "site-pexels-com-shoreditch-london-street-4.jpg",
    "london-brick.jpg": "site-pexels-com-shoreditch-london-street-3.jpg",

    # fabric swatches
    "swatch-01.jpg": "site-pexels-com-linen-shirt-woman-close--1.jpg",
    "swatch-02.jpg": "site-pexels-com-linen-shirt-woman-close--4.jpg",
    "swatch-03.jpg": "site-pexels-com-linen-shirt-woman-close--5.jpg",
    "swatch-04.jpg": "site-pexels-com-silk-scarf-beige-neutral-5.jpg",
    "swatch-05.jpg": "site-pexels-com-linen-shirt-woman-close--1.jpg",
    "swatch-06.jpg": "site-pexels-com-linen-shirt-woman-close--4.jpg",
    "swatch-07.jpg": "site-pexels-com-linen-shirt-woman-close--5.jpg",
    "swatch-08.jpg": "site-pexels-com-silk-scarf-beige-neutral-5.jpg",

    # occasion tiles
    "occasion-workwear.jpg": "site-pexels-com-woman-beige-tailored-sui-1.jpg",
    "occasion-weekend.jpg": "site-pexels-com-minimalist-neutral-fashi-4.jpg",
    "occasion-festive.jpg": "site-pexels-com-woman-elegant-occasion-d-2.jpg",
    "occasion-wedding.jpg": "site-pexels-com-woman-beige-linen-dress--4.jpg",
    "occasion-evening.jpg": "site-pexels-com-woman-silk-cream-slip-dr-5.jpg",

    # blog / editorial pages
    "blog-craft.jpg": "site-pexels-com-loom-weaving-hands-linen-2.jpg",
    "blog-london.jpg": "site-pexels-com-shoreditch-london-street-1.jpg",
    "blog-linen.jpg": "site-pexels-com-linen-shirt-woman-close--4.jpg",
    "blog-single-hero.jpg": "site-pexels-com-loom-weaving-hands-linen-1.jpg",
    "about-atelier.jpg": "site-pexels-com-sewing-machine-tailor-ha-1.jpg",
    "about-london.jpg": "site-pexels-com-shoreditch-london-street-4.jpg",

    # UGC / Instagram / lookbook grid reuse
    "ugc-01.jpg": "site-pexels-com-woman-beige-tailored-sui-4.jpg",
    "ugc-02.jpg": "site-pexels-com-woman-beige-tailored-sui-4.jpg",
    "ugc-03.jpg": "site-pexels-com-woman-beige-linen-dress--2.jpg",
    "ugc-04.jpg": "site-pexels-com-fashion-editorial-model--4.jpg",
    "ugc-05.jpg": "site-pexels-com-minimalist-neutral-fashi-2.jpg",
    "ugc-06.jpg": "site-pexels-com-woman-silk-cream-slip-dr-2.jpg",
    "instagram-01.jpg": "site-pexels-com-fashion-editorial-model--1.jpg",
    "instagram-02.jpg": "site-pexels-com-silk-scarf-beige-neutral-3.jpg",
    "instagram-03.jpg": "site-pexels-com-woman-beige-linen-dress--5.jpg",
    "instagram-04.jpg": "site-pexels-com-silk-scarf-beige-neutral-3.jpg",
    "instagram-05.jpg": "site-pexels-com-woman-elegant-occasion-d-3.jpg",
    "instagram-06.jpg": "site-pexels-com-neutral-leather-handbag--3.jpg",

    # product primaries / hover images
    "product-01.jpg": "site-pexels-com-woman-beige-tailored-sui-2.jpg",
    "product-01-hover.jpg": "site-pexels-com-woman-beige-tailored-sui-1.jpg",
    "product-02.jpg": "site-pexels-com-woman-beige-linen-dress--2.jpg",
    "product-02-hover.jpg": "site-pexels-com-woman-beige-linen-dress--4.jpg",
    "product-03.jpg": "site-pexels-com-woman-silk-cream-slip-dr-5.jpg",
    "product-03-hover.jpg": "site-pexels-com-woman-silk-cream-slip-dr-4.jpg",
    "product-04.jpg": "site-pexels-com-fashion-editorial-model--1.jpg",
    "product-04-hover.jpg": "site-pexels-com-fashion-editorial-model--5.jpg",
    "product-05.jpg": "site-pexels-com-minimalist-neutral-fashi-2.jpg",
    "product-05-hover.jpg": "site-pexels-com-minimalist-neutral-fashi-3.jpg",
    "product-06.jpg": "site-pexels-com-fashion-editorial-model--1.jpg",
    "product-06-hover.jpg": "site-pexels-com-fashion-editorial-model--5.jpg",
    "product-07.jpg": "site-pexels-com-woman-beige-tailored-sui-3.jpg",
    "product-07-hover.jpg": "site-pexels-com-woman-beige-tailored-sui-4.jpg",
    "product-08.jpg": "site-pexels-com-woman-elegant-occasion-d-3.jpg",
    "product-08-hover.jpg": "site-pexels-com-woman-elegant-occasion-d-2.jpg",
    "product-09.jpg": "site-pexels-com-woman-beige-tailored-sui-1.jpg",
    "product-09-hover.jpg": "site-pexels-com-woman-beige-tailored-sui-5.jpg",
    "product-10.jpg": "site-pexels-com-woman-beige-linen-dress--5.jpg",
    "product-10-hover.jpg": "site-pexels-com-woman-beige-linen-dress--1.jpg",
    "product-11.jpg": "site-pexels-com-woman-silk-cream-slip-dr-2.jpg",
    "product-11-hover.jpg": "site-pexels-com-woman-silk-cream-slip-dr-1.jpg",
    "product-12.jpg": "site-pexels-com-woman-elegant-occasion-d-5.jpg",
    "product-12-hover.jpg": "site-pexels-com-woman-elegant-occasion-d-4.jpg",
    "product-13.jpg": "site-pexels-com-neutral-leather-handbag--2.jpg",
    "product-13-hover.jpg": "site-pexels-com-neutral-leather-handbag--3.jpg",
    "product-14.jpg": "site-pexels-com-silk-scarf-beige-neutral-5.jpg",
    "product-14-hover.jpg": "site-pexels-com-silk-scarf-beige-neutral-3.jpg",
    "product-15.jpg": "site-pexels-com-linen-shirt-woman-close--2.jpg",
    "product-15-hover.jpg": "site-pexels-com-linen-shirt-woman-close--2.jpg",
    "product-16.jpg": "site-pexels-com-linen-shirt-woman-close--4.jpg",
    "product-16-hover.jpg": "site-pexels-com-linen-shirt-woman-close--4.jpg",
    "product-17.jpg": "site-pexels-com-fashion-editorial-model--3.jpg",
    "product-17-hover.jpg": "site-pexels-com-fashion-editorial-model--4.jpg",
    "product-18.jpg": "site-pexels-com-woman-elegant-occasion-d-1.jpg",
    "product-18-hover.jpg": "site-pexels-com-woman-silk-cream-slip-dr-3.jpg",
}


def prepare(src_path, dst_path):
    im = Image.open(src_path)
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, LINEN + (255,))
        im = Image.alpha_composite(bg, rgba).convert("RGB")
    else:
        im = im.convert("RGB")

    # A restrained warm grade ties mixed shoots into the linen/taupe palette.
    im = ImageEnhance.Color(im).enhance(0.95)
    im = ImageEnhance.Contrast(im).enhance(1.025)
    im = ImageEnhance.Brightness(im).enhance(1.012)
    im = Image.blend(im, Image.new("RGB", im.size, WARM), 0.045)

    if max(im.size) > 1400:
        im.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
    im.save(dst_path, "JPEG", quality=86, optimize=True, progressive=True)


missing = []
for name, raw in MAP.items():
    p = SRC / raw
    if not p.exists():
        missing.append(raw)
        continue
    prepare(p, OUT / name)

(OUT / "CREDITS.md").write_text('''# Photography credits

All photography is stored locally in this folder and is served from the site itself — there are no remote image URLs. Images are free-licence editorial/stock photography sourced through image search (predominantly Pexels, with a small number of Pinterest/Etsy/StockCake result previews), then lightly colour-graded to the LINEN & LOOM palette.

`tools/prepare_images.py` documents the raw filename used for each local asset and the normalisation applied. Product names, prices, reviews, atelier copy and store details are fictional storefront content created for this brief.
''')

print(f"Wrote {len(MAP) - len(missing)} images to {OUT}")
if missing:
    print("Missing raw files:", *missing, sep="\n- ")
