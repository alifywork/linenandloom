#!/usr/bin/env python3
"""Generate the LINEN & LOOM logo/favicon family from the supplied brand brief.

The SVGs are hand-authored line art (no tracing, no stock icon). PNG favicons are
rendered locally with Pillow so the site has no external icon/font dependency.
"""
from pathlib import Path
import html
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
LOGOS = ROOT / "assets" / "logos"
ICONS = ROOT / "assets" / "icons"
LOGOS.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)

ESPRESSO = "#2E2A26"
TAUPE = "#B7A28B"
MAROON = "#8C3A3A"
LINEN = "#F7F4F0"
WHITE = "#FFFFFF"


def loom_lines(x, y, s, color, width=1.7):
    """Three vertical warp threads crossed by one horizontal weft line."""
    w = width * s
    return f'''<g fill="none" stroke="{color}" stroke-width="{w:.2f}" stroke-linecap="square">
    <path d="M {x + 6*s} {y + 2*s} V {y + 34*s}" />
    <path d="M {x + 16*s} {y + 2*s} V {y + 34*s}" />
    <path d="M {x + 26*s} {y + 2*s} V {y + 34*s}" />
    <path d="M {x + 1*s} {y + 18*s} H {x + 31*s}" />
  </g>'''


def wordmark(x, y, color, amp=MAROON, size=25, tracking=3.6, anchor="start"):
    # Georgia is a robust local serif fallback; the brand display face is used
    # for all HTML text via the bundled Marcellus woff2.
    return f'''<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{color}" font-family="Georgia, 'Times New Roman', serif" font-size="{size}" font-weight="400" letter-spacing="{tracking}">LINEN <tspan fill="{amp}">&amp;</tspan> LOOM</text>'''


def svg(view, body, title):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-labelledby="logo-title">
  <title id="logo-title">{html.escape(title, quote=False)}</title>
  {body}
</svg>
'''


# Horizontal wordmark + loom motif
horizontal = svg(
    "0 0 390 70",
    loom_lines(8, 17, 1.05, ESPRESSO) + wordmark(58, 45, ESPRESSO),
    "LINEN & LOOM — horizontal wordmark with loom motif",
)
(LOGOS / "logo.svg").write_text(horizontal)
(LOGOS / "logo-horizontal.svg").write_text(horizontal)

# White and mono variants
white_body = loom_lines(8, 17, 1.05, WHITE) + wordmark(58, 45, WHITE, amp=TAUPE)
(LOGOS / "logo-white.svg").write_text(svg("0 0 390 70", white_body, "LINEN & LOOM — white wordmark"))
mono_body = loom_lines(8, 17, 1.05, ESPRESSO) + wordmark(58, 45, ESPRESSO, amp=ESPRESSO)
(LOGOS / "logo-mono.svg").write_text(svg("0 0 390 70", mono_body, "LINEN & LOOM — monochrome wordmark"))

# Vertical lockup
vertical = svg(
    "0 0 320 120",
    loom_lines(144, 8, 1.05, ESPRESSO) +
    wordmark(160, 92, ESPRESSO, size=22, tracking=3.2, anchor="middle"),
    "LINEN & LOOM — vertical wordmark with loom motif",
)
(LOGOS / "logo-vertical.svg").write_text(vertical)

# Icon only / favicon source
icon_only = svg(
    "0 0 48 48",
    f'<rect width="48" height="48" fill="{LINEN}"/>' + loom_lines(8, 7, 1, ESPRESSO, width=1.9),
    "LINEN & LOOM — loom motif",
)
(LOGOS / "logo-icon-only.svg").write_text(icon_only)
(ICONS / "favicon.svg").write_text(icon_only)


def favicon_png(size):
    scale = 4
    s = size * scale
    im = Image.new("RGB", (s, s), LINEN)
    d = ImageDraw.Draw(im)
    # Very subtle inset frame, keeping the linen square legible at 16px.
    d.rectangle([0, 0, s - 1, s - 1], outline=(231, 225, 217), width=max(1, scale // 2))
    cx = s / 2
    top = s * 0.22
    bottom = s * 0.78
    gap = s * 0.12
    weft_y = s * 0.50
    lw = max(2, int(s * 0.035))
    for dx in (-gap, 0, gap):
        d.line([(cx + dx, top), (cx + dx, bottom)], fill=ESPRESSO, width=lw)
    d.line([(cx - gap * 1.55, weft_y), (cx + gap * 1.55, weft_y)], fill=ESPRESSO, width=lw)
    return im.resize((size, size), Image.Resampling.LANCZOS)


for size in (16, 32, 48, 180, 192, 512):
    out = ICONS / (f"apple-touch-icon.png" if size == 180 else f"favicon-{size}x{size}.png")
    favicon_png(size).save(out, optimize=True)

# Multi-resolution ICO for legacy browsers.
ico = favicon_png(48)
ico.save(ICONS / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

(ROOT / "site.webmanifest").write_text('''{
  "name": "LINEN & LOOM — London Womenswear",
  "short_name": "Linen & Loom",
  "description": "Premium womenswear, considered fabric and a Shoreditch atelier.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#F7F4F0",
  "theme_color": "#2E2A26",
  "icons": [
    { "src": "assets/icons/favicon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "assets/icons/favicon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
''')

(LOGOS / "README.md").write_text('''# Logo lockups

All files are local SVG line art built from the brief: three vertical warp threads crossed by one horizontal weft line.

- `logo.svg` / `logo-horizontal.svg` — primary horizontal lockup
- `logo-vertical.svg` — centred lockup for editorial/footer uses
- `logo-white.svg` — reverses to white, with a taupe ampersand
- `logo-mono.svg` — single-colour espresso production mark
- `logo-icon-only.svg` — loom motif only

Favicon PNGs are in `../icons/`; `site.webmanifest` is at the repository root.
''')

print("Brand assets written to", LOGOS, "and", ICONS)
