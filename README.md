# LINEN & LOOM

An editorial fashion storefront for a fictional premium womenswear label in Shoreditch, London. Built as a static, offline-capable site — **every CSS, JS, font, icon, logo, favicon and photograph is stored locally**. There are no CDN calls, no Google Fonts, no remote images and no API requests at runtime.

## Run it

No build step and no `npm install` are required.

```bash
cd /home/user/linenandloom
python3 -m http.server 8000 --bind 0.0.0.0
```

Open `http://localhost:8000/` (or the Arena live preview). All 18 pages are plain `.html` files in the repository root.

## The 18 pages

| # | File | Purpose |
| --- | --- | --- |
| 1 | `index.html` | Home — all 24 briefed sections, including globally injected shell pieces |
| 2 | `shop.html` | Filter sidebar + 3-column product grid + sort toolbar |
| 3 | `category.html` | Four category views via `?c=unstitched-fabric`, `ready-to-wear`, `occasion`, `accessories` |
| 4 | `product.html` | Dynamic PDP via `?p=<id>`; all 14 briefed sections including sticky options, gallery zoom, reviews and mobile add bar |
| 5 | `quick-view.html` | Quick-view modal showcase (auto-opens on load) |
| 6 | `cart.html` | Bag page + 400px slide-in cart drawer (auto-opens on load) |
| 7 | `checkout.html` | 60/40 checkout, Klarna Pay in 3, VAT line, sticky summary |
| 8 | `wishlist.html` | Locally saved wishlist |
| 9 | `about.html` | Our Craft / atelier story |
| 10 | `lookbook.html` | Winter 2026 editorial lookbook |
| 11 | `size-guide.html` | UK 6–18 + EU/US conversion and measurements |
| 12 | `blog.html` | Journal index |
| 13 | `blog-single.html` | Journal article via `?post=<slug>` |
| 14 | `faq.html` | Searchable FAQ accordion |
| 15 | `shipping-returns.html` | Delivery, VAT and 28-day returns policy |
| 16 | `track-order.html` | Front-end order lookup demo |
| 17 | `contact.html` | Atelier contact form and London details |
| 18 | `404.html` | Editorial not-found page |

Global shell sections (announcement marquee, centred-logo split header, footer, cart drawer, quick-view modal, size-chart modal, search, mobile nav, GDPR cookie panel and toasts) are injected by `assets/js/site.js` into every page.

## Local dependencies

Fetched from npm and copied into `assets/vendor/`; see `assets/vendor/README.md` for versions and licences.

- Bootstrap 5.3.8 — grid, accordion, modal and utilities
- GSAP 3.15.0 + Draggable + ScrollTrigger — hero zoom, marquee, parallax, draggable carousels, drawer timeline, modal scale-in, reveals, pinned lookbook
- Font Awesome Free 7.3.1 — the supplied icon map
- Phosphor Icons 2.1.2 — carousel arrows, close, plus/minus and navigation accents
- Marcellus, Prata and Jost woff2 files — self-hosted from Fontsource 5.3.0

Brand assets live in `assets/logos/` and `assets/icons/`: six SVG logo lockups, `favicon.svg`, 16/32/48/192/512 PNGs, `apple-touch-icon.png`, `favicon.ico` and `site.webmanifest`.

Photography is stored in `assets/images/` and lightly graded to the linen/taupe palette; `assets/images/CREDITS.md` and `tools/prepare_images.py` document its provenance and processing.

## What works

- Cart, wishlist, recently viewed and GDPR consent are persisted in `localStorage`.
- Quick add, quick view, UK size/colour/quantity selection, Buy Now, bag steppers, free-delivery progress, subtotal and checkout totals all update locally.
- Shop filters (category, UK size, colour, price, sale), sorting and URL presets work client-side.
- Product detail, category and journal pages are data-driven from `assets/js/data.js`.
- Newsletter, contact, track-order and checkout forms validate and respond in-page; **no payment is processed**.
- `prefers-reduced-motion` disables GSAP motion and falls back to native horizontal scrolling; motion is also skipped automatically in DOM environments with no measurable layout.
- All photography is bundled locally and is Pexels-derived; see `assets/images/CREDITS.md`.

## Reproducibility tools

- `tools/make_brand_assets.py` — regenerates the SVG/favicon family (requires Pillow)
- `tools/prepare_images.py` — maps raw downloaded photos into `assets/images/` (requires Pillow; the raw search thumbnails are not redistributed)
- `tools/generate_pages.py` — regenerates all 18 HTML files from the shared local shell

The generated HTML, CSS, JavaScript, fonts, icons and imagery are included in the repository, so none of these scripts are needed to browse the site.

> This is a design/front-end demonstration. LINEN & LOOM, its address, phone number, reviews, orders and product catalogue are fictional content for the brief.
