#!/usr/bin/env python3
"""Generate the 18 static storefront pages from one consistent local shell.

The generated HTML is committed; this script is kept for reproducibility. It
deliberately uses only local CSS, JS, fonts, icons and images.
"""
from pathlib import Path
from string import Template
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]

HEAD = Template('''<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#2E2A26">
  <meta name="description" content="$description">
  <title>$title</title>
  <link rel="icon" href="assets/icons/favicon.ico" sizes="any">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/icons/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="48x48" href="assets/icons/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/icons/favicon-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="assets/icons/favicon-512x512.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  <link rel="preload" href="assets/fonts/marcellus-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/jost-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/vendor/bootstrap/css/bootstrap.min.css">
  <link rel="stylesheet" href="assets/vendor/fontawesome/css/all.min.css">
  <link rel="stylesheet" href="assets/vendor/phosphor/regular/style.css">
  <link rel="stylesheet" href="assets/vendor/phosphor/bold/style.css">
  <link rel="stylesheet" href="assets/vendor/phosphor/fill/style.css">
  <link rel="stylesheet" href="assets/css/fonts.css">
  <link rel="stylesheet" href="assets/css/site.css">
</head>
<body data-page="$data_page"$auto_attr>
  <a class="visually-hidden visually-hidden-focusable position-absolute top-0 start-0 p-3 bg-white" href="#main-content">Skip to content</a>
  <div id="site-header"></div>
  <noscript><div class="container py-3 small-copy">This storefront uses JavaScript for the bag, wishlist, quick view and cookie preferences. Product pages and editorial content remain readable.</div></noscript>
  <main id="main-content">
$body
  </main>
  <div id="site-footer"></div>
  <div id="site-overlays"></div>
  <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="assets/vendor/gsap/gsap.min.js"></script>
  <script src="assets/vendor/gsap/Draggable.min.js"></script>
  <script src="assets/vendor/gsap/ScrollTrigger.min.js"></script>
  <script src="assets/js/data.js"></script>
  <script src="assets/js/site.js"></script>
$scripts
</body>
</html>
''')


def page(filename, title, description, data_page, body, extra_scripts=(), auto_open=None):
    scripts = list(extra_scripts) + ['assets/js/page.js']
    script_tags = '\n'.join('  <script src="%s"></script>' % s for s in scripts)
    auto_attr = ' data-auto-open="%s"' % auto_open if auto_open else ''
    html = HEAD.substitute(
        title=title, description=description, data_page=data_page,
        auto_attr=auto_attr, body=dedent(body).strip(), scripts=script_tags
    )
    (ROOT / filename).write_text(html)
    print('wrote', filename)


def eyebrow(text, cls=''):
    return '<span class="eyebrow %s">%s</span>' % (cls, text)


def breadcrumb(items):
    parts = []
    for i, (label, href) in enumerate(items):
        if i:
            parts.append('<i class="fa-solid fa-chevron-right"></i>')
        if href:
            parts.append('<a href="%s">%s</a>' % (href, label))
        else:
            parts.append('<span data-breadcrumb-current>%s</span>' % label)
    return '<nav class="breadcrumb-editorial" aria-label="Breadcrumb">%s</nav>' % ''.join(parts)


def page_hero(label, title, lede, crumbs=None):
    crumb_html = breadcrumb(crumbs) if crumbs else ''
    return '''
<section class="page-hero">
  <div class="container">
    %s
    %s
    <h1>%s</h1>
    <p class="lede">%s</p>
  </div>
</section>''' % (crumb_html, eyebrow(label), title, lede)


def section_head(label, title, copy='', actions=''):
    return '''
<div class="section-head reveal">
  <div class="section-head__copy">%s<h2>%s</h2>%s</div>
  %s
</div>''' % (eyebrow(label), title, ('<p class="lede" style="margin-top:14px">%s</p>' % copy) if copy else '', actions)


def product_grid(kind, cls='product-grid', limit=0, attrs='', empty=''):
    data = ' data-products="%s"' % kind
    if limit:
        data += ' data-limit="%d"' % limit
    if empty:
        data += ' data-empty="%s"' % empty
    if attrs:
        data += ' ' + attrs
    return '<div class="%s" data-stagger%s></div>' % (cls, data)


def carousel(kind, label, title, link_text, link_href, limit=0, section_class='section', extra=''):
    data = ' data-products="%s"' % kind
    if limit:
        data += ' data-limit="%d"' % limit
    if extra:
        data += ' ' + extra
    return '''
<section class="%s">
  <div class="container">
    <div class="carousel" data-carousel>
      <div class="section-head reveal">
        <div class="section-head__copy">%s<h2>%s</h2></div>
        <div class="section-head__actions">
          <a class="text-link" href="%s">%s <i class="ph ph-arrow-up-right"></i></a>
          <div class="section-head__arrows">
            <button class="carousel-arrow" type="button" data-carousel-prev aria-label="Previous products"><i class="ph ph-arrow-left"></i></button>
            <button class="carousel-arrow" type="button" data-carousel-next aria-label="Next products"><i class="ph ph-arrow-right"></i></button>
          </div>
        </div>
      </div>
      <div class="carousel-viewport"><div class="carousel-track" data-stagger%s></div></div>
      <div class="carousel-progress"><span></span></div>
    </div>
  </div>
</section>''' % (section_class, eyebrow(label), title, link_href, link_text, data)


def values_row():
    items = [
        ('fa-solid fa-leaf', 'Ethical', 'Traceable cloth, lower-impact dyes and small production runs.'),
        ('fa-solid fa-hand-holding-heart', 'Woven in Britain', 'Patterns drafted and finished in our Shoreditch atelier.'),
        ('fa-solid fa-award', 'Quality', 'Considered seams, natural fibres and pieces made to be kept.'),
        ('fa-solid fa-rotate-left', 'Easy Returns', 'Free 28-day UK returns, with fit advice by phone or email.')
    ]
    return '<div class="values-row" data-stagger>' + ''.join(
        '<div class="value-item"><i class="%s"></i><h3>%s</h3><p>%s</p></div>' % x for x in items
    ) + '</div>'


def trust_row():
    items = [
        ('fa-solid fa-truck-fast', 'Free UK delivery', 'Royal Mail Tracked 48 over £120'),
        ('fa-solid fa-rotate-left', '28-day returns', 'Free returns from the UK'),
        ('fa-solid fa-lock', 'Secure checkout', 'Visa · Mastercard · Amex · PayPal'),
        ('fa-solid fa-globe', 'Ships EU', 'VAT included at checkout')
    ]
    return '<div class="trust-row">' + ''.join(
        '<div class="trust-item"><i class="%s"></i><div><strong>%s</strong><span>%s</span></div></div>' % x for x in items
    ) + '</div>'


def payment_badges():
    return '''
<div class="payment-badges">
  <span class="payment-badge"><i class="fa-brands fa-cc-visa"></i></span>
  <span class="payment-badge"><i class="fa-brands fa-cc-mastercard"></i></span>
  <span class="payment-badge"><i class="fa-brands fa-cc-amex"></i></span>
  <span class="payment-badge"><i class="fa-brands fa-cc-paypal"></i></span>
  <span class="payment-badge"><i class="fa-brands fa-apple-pay"></i></span>
  <span class="payment-badge"><i class="fa-brands fa-google-pay"></i></span>
  <span class="klarna-badge">Klarna. Pay in 3</span>
  <span class="payment-badge payment-badge--text"><i class="fa-solid fa-truck-fast"></i> Royal Mail</span>
</div>'''


def newsletter():
    return '''
<section class="section newsletter">
  <div class="container newsletter__grid">
    <div class="reveal">
      %s
      <h2>10%% off your first order</h2>
      <p>A considered letter from the atelier: new cloth, quiet styling notes and early access to small runs. No noise.</p>
    </div>
    <div class="reveal">
      <form class="newsletter-form" data-newsletter>
        <label class="visually-hidden" for="newsletter-email">Email address</label>
        <input id="newsletter-email" type="email" placeholder="Your email address" required>
        <button class="btn-editorial" type="submit">Subscribe <i class="fa-solid fa-paper-plane"></i></button>
      </form>
      <p class="newsletter-note">Use code LINEN10 · Unsubscribe whenever you like · GDPR friendly</p>
    </div>
  </div>
</section>''' % eyebrow('The atelier letter')


def home():
    return '''
<!-- 3 / Hero — 45/55 split with a slow Ken Burns push-in -->
<section class="hero" aria-labelledby="hero-title">
  <div class="hero-grid">
    <div class="hero-copy">
      <div class="hero-copy__inner">
        %s
        <h1 id="hero-title">A quieter kind of luxury.</h1>
        <p class="lede">Considered womenswear, cut from cloth that feels as good on the hundredth wear as it did on the first. Made in small runs at our Shoreditch atelier.</p>
        <div class="hero-actions">
          <a class="btn-editorial" href="shop.html">Shop the collection <i class="ph ph-arrow-right"></i></a>
          <a class="btn-outline" href="about.html">Discover our craft</a>
        </div>
        <div class="hero-meta">
          <span><i class="fa-solid fa-truck-fast"></i> Free UK delivery over £120</span>
          <span><i class="fa-solid fa-rotate-left"></i> Free 28-day returns</span>
        </div>
      </div>
      <span class="hero-vertical">Est. London · Autumn / Winter 2026</span>
    </div>
    <div class="hero-media">
      <img src="assets/images/hero-editorial.jpg" alt="Model in a fluid neutral linen wrap dress" fetchpriority="high">
      <span class="hero-tag">New In · Winter 2026</span>
      <span class="hero-caption">Look 01 / The Shoreditch Wrap</span>
    </div>
  </div>
</section>

<!-- 4 / Category tiles -->
<section class="section section--tight" id="categories">
  <div class="container">
    %s
  </div>
  <div class="container-fluid" style="margin-top:34px"><div class="category-grid" data-render="categories" data-stagger></div></div>
</section>

<!-- 5 / New arrivals drag carousel -->
%s

<!-- 6 / Featured collection full-bleed parallax -->
<section class="campaign-banner" aria-label="The Atelier Collection">
  <img class="campaign-banner__image" src="assets/images/campaign-wide.jpg" alt="The Atelier Collection campaign" loading="lazy">
  <div class="container campaign-banner__content">
    <div class="campaign-banner__inner reveal">
      %s
      <h2>The Atelier Collection</h2>
      <p>Cloth, cut and quiet confidence. Six pieces made in a small Shoreditch run, photographed in the studio where they were finished.</p>
      <a class="btn-light-editorial" href="lookbook.html">View the lookbook <i class="ph ph-arrow-right"></i></a>
    </div>
  </div>
</section>

<!-- 7 / Bestsellers 4 × 2 -->
<section class="section" id="bestsellers">
  <div class="container">
    %s
    %s
  </div>
</section>

<!-- 8 / Boxing Day Sale countdown -->
<section class="sale-strip" aria-label="Boxing Day Sale countdown">
  <div class="container sale-strip__grid">
    <div>
      %s
      <h2>Boxing Day Sale · up to 40%% off</h2>
      <p>Selected tailoring, silk and cloth by the metre. The countdown starts now.</p>
      <div class="countdown" data-countdown>
        <div class="countdown__unit"><span class="countdown__num" data-countdown-days>00</span><span class="countdown__label">Days</span></div>
        <div class="countdown__unit"><span class="countdown__num" data-countdown-hours>00</span><span class="countdown__label">Hours</span></div>
        <div class="countdown__unit"><span class="countdown__num" data-countdown-minutes>00</span><span class="countdown__label">Minutes</span></div>
        <div class="countdown__unit"><span class="countdown__num" data-countdown-seconds>00</span><span class="countdown__label">Seconds</span></div>
      </div>
    </div>
    <div class="sale-strip__cta"><i class="fa-solid fa-tag" style="font-size:1.6rem"></i><a class="btn-light-editorial" href="shop.html?sale=1">Shop the Boxing Day Sale <i class="ph ph-arrow-right"></i></a><span class="small-copy" style="color:rgba(255,255,255,.7)">UK sizes 6–18 · Free returns</span></div>
  </div>
</section>

<!-- 9 / Product story — sticky two-column -->
<section class="section section--white" id="craft">
  <div class="container story-grid">
    <div class="story-media reveal"><img src="assets/images/story-loom.jpg" alt="Traditional loom in a textile workshop" loading="lazy"><div class="story-media__caption"><span>01 / The loom</span><span>Belgian linen</span></div></div>
    <div class="story-copy">
      %s
      <h2>From flax field to finished seam</h2>
      <p class="lede">We choose cloth before we sketch a silhouette. It is a slower way to work, but it is the only way we know how to make a wardrobe that lasts.</p>
      <div class="story-step"><span class="story-step__num">01</span><div><h3>Source</h3><p>Belgian flax, organic cotton and mulberry silk from mills we visit. Every roll is checked for hand-feel, weight and how it will age.</p></div></div>
      <div class="story-step"><span class="story-step__num">02</span><div><h3>Cut</h3><p>Patterns are drafted at 48 Redchurch Street, graded to UK 6–18 and cut in small batches so nothing is over-produced.</p></div></div>
      <div class="story-step"><span class="story-step__num">03</span><div><h3>Finish</h3><p>Seams are pressed, buttons are sewn by hand and each piece is checked against the original sample before it leaves the atelier.</p></div></div>
      <div class="story-secondary reveal"><img src="assets/images/story-hands.jpg" alt="Hands sewing cloth in the atelier" loading="lazy"><img src="assets/images/fabric-rolls.jpg" alt="Rolls of neutral fabric" loading="lazy"></div>
    </div>
  </div>
</section>

<!-- 10 / Fabric swatch strip -->
<section class="section section--tight section--warm">
  <div class="container">
    %s
  </div>
  <div class="container-fluid padded" style="margin-top:30px"><div class="swatch-strip" data-render="swatches" aria-label="Fabric swatches"></div></div>
</section>

<!-- 11 / Shop by occasion, 5 tiles -->
<section class="section" id="occasions">
  <div class="container">
    %s
  </div>
  <div class="container-fluid padded" style="margin-top:30px"><div class="occasion-grid" data-render="occasions" data-stagger></div></div>
</section>

<!-- 12 / Size guide teaser with chart preview modal -->
<section class="section section--white">
  <div class="container size-teaser reveal">
    <div class="size-teaser__copy">
      %s
      <h2>Find your fit, without the guesswork</h2>
      <p>Our clothing is graded to UK sizes 6–18. Compare UK, EU and US conversions, or speak to the atelier for a fit note before you order.</p>
      <button class="btn-editorial" type="button" data-open-size-chart>Open size chart <i class="fa-solid fa-ruler"></i></button>
      <a class="text-link" href="size-guide.html" style="margin-left:18px">Full guide <i class="ph ph-arrow-up-right"></i></a>
    </div>
    <div class="size-teaser__visual">
      <i class="fa-solid fa-ruler size-teaser__ruler"></i>
      <table class="size-table size-table--compact"><thead><tr><th>UK</th><th>EU</th><th>US</th></tr></thead><tbody data-render="size-rows" data-limit="4" data-cols="conversion"></tbody></table>
      <p class="small-copy" style="margin-top:16px">Measurements in cm · Between sizes? Size up for a relaxed fit.</p>
    </div>
  </div>
</section>

<!-- 13 / Pinned horizontal lookbook -->
<section class="lookbook" id="lookbook-home">
  <div class="container lookbook__intro section-head reveal">
    <div class="section-head__copy">%s<h2>The Winter Lookbook</h2><p class="lede" style="margin-top:14px;color:rgba(255,255,255,.66)">Six looks, one quiet palette. Scroll to move through the edit.</p></div>
    <a class="text-link" href="lookbook.html" style="color:#fff;border-color:#fff">Full lookbook <i class="ph ph-arrow-up-right"></i></a>
  </div>
  <div class="lookbook-pin"><div class="lookbook-track" data-render="lookbook"></div></div>
  <div class="container lookbook__foot"><div class="lookbook-progress"><span></span></div></div>
</section>

<!-- 14 / UGC grid -->
<section class="section section--tight">
  <div class="container">%s</div>
  <div class="container-fluid" style="margin-top:30px"><div class="ugc-grid" data-render="ugc" data-stagger></div></div>
</section>

<!-- 15 / Reviews -->
<section class="section section--white" id="reviews">
  <div class="container">
    %s
    <div class="reviews-top reveal"><span class="reviews-score">4.8<span style="font-size:1.1rem;color:var(--clr-muted)"> / 5</span></span><div class="reviews-score__meta"><strong>Excellent</strong> · 1,284 verified reviews<br><span class="stars">★★★★★</span> Trustpilot-style independent feedback</div><a class="text-link" href="product.html?p=harrow-linen-blazer#reviews">Read product reviews <i class="ph ph-arrow-up-right"></i></a></div>
    <div class="review-grid" data-render="reviews" data-stagger></div>
  </div>
</section>

<!-- 16 / Instagram shoppable grid -->
<section class="section section--tight">
  <div class="container">%s</div>
  <div class="container-fluid" style="margin-top:30px"><div class="instagram-grid" data-render="instagram" data-stagger></div></div>
</section>

<!-- 17 / Journal -->
<section class="section section--white">
  <div class="container">
    %s
    <div class="blog-grid" data-render="blog-home" data-stagger></div>
  </div>
</section>

<!-- 18 / Brand values -->
<section class="section section--tight"><div class="container">%s</div></section>

<!-- 19 / Newsletter -->
%s

<!-- 20 / Store locations -->
<section class="section section--white">
  <div class="container locations-grid">
    <div class="locations-image reveal"><img src="assets/images/london-street.jpg" alt="Red brick street in London" loading="lazy"><span class="locations-image__tag">48 Redchurch St · Shoreditch</span></div>
    <div class="locations-copy reveal">
      %s
      <h2>Visit the Shoreditch atelier</h2>
      <p>Fittings, fabric by the metre and the working studio share one light-filled space a few minutes from Brick Lane.</p>
      <div class="locations-detail"><i class="fa-solid fa-map-pin"></i><div><strong>Address</strong>48 Redchurch St, Shoreditch, London E2 7DP</div></div>
      <div class="locations-detail"><i class="fa-solid fa-phone"></i><div><strong>Telephone</strong><a href="tel:+442079460958">+44 20 7946 0958</a></div></div>
      <div class="locations-detail"><i class="fa-solid fa-clock"></i><div><strong>Opening hours</strong>Tue–Sat, 10:00–18:00 · Sunday by appointment</div></div>
      <div class="stockists"><h4>Selected stockists</h4><ul><li>The Garment Room, Marylebone <span>London</span></li><li>Studio Ninety <span>Bristol</span></li><li>Atelier Nord <span>Copenhagen</span></li></ul></div>
    </div>
  </div>
</section>

<!-- 21 / Payment & delivery badges -->
<section class="section section--tight">
  <div class="container">%s%s%s<p class="small-copy" style="margin-top:18px">Visa, Mastercard, Amex, PayPal, Klarna (3 interest-free payments) and Apple Pay. VAT is included in every displayed price. We ship across the UK and EU.</p></div>
</section>
''' % (
        eyebrow('Autumn / Winter 2026 · London'),
        section_head('Shop by category', 'Four ways into the wardrobe', 'Cloth by the metre, quiet tailoring, occasion pieces and the finishing notes.'),
        carousel('new', 'Just arrived', 'New Arrivals', 'Shop all new in', 'shop.html?sort=newest', 8),
        eyebrow('Featured collection', 'eyebrow--light'),
        section_head('Loved, and reordered', 'Bestsellers', 'The pieces our clients return to, season after season.'),
        product_grid('bestsellers', 'product-grid product-grid--4', 8),
        eyebrow('The sale edit', 'eyebrow--light'),
        eyebrow('Our cloth'),
        section_head('The material library', 'Touch it first', 'Hover a swatch for its name. Eight cloths, all chosen for hand-feel and how they age.'),
        section_head('Shop by occasion', 'Dressed for the actual day', 'Five edits, from a Tuesday meeting to a winter wedding.'),
        eyebrow('Size & fit'),
        eyebrow('From the lookbook', 'eyebrow--light'),
        section_head('Worn in the wild', '#LINENANDLOOM', 'Tag us in your edit — we love seeing how you wear the pieces.'),
        section_head('The verdict', 'Quietly well reviewed', 'Independent feedback from women who wear the clothes on real days.'),
        section_head('Shop the feed', '@linenandloom', 'Tap a look to open quick view without leaving the page.'),
        section_head('From the journal', 'Notes from the atelier', 'Cloth, craft and the small decisions behind a considered wardrobe.'),
        values_row(),
        newsletter(),
        eyebrow('Find us'),
        section_head('Delivery, payments & peace of mind', 'Considered to the last detail'),
        trust_row(), payment_badges()
    )


def shop():
    category_boxes = ''.join(
        '<li><label><input type="checkbox" data-filter-category value="%s"><span>%s</span></label></li>' % (c['slug'], c['title'])
        for c in [
            {'slug': 'unstitched-fabric', 'title': 'Unstitched Fabric'},
            {'slug': 'ready-to-wear', 'title': 'Ready-to-Wear'},
            {'slug': 'occasion', 'title': 'Occasion'},
            {'slug': 'accessories', 'title': 'Accessories'}
        ]
    )
    size_boxes = ''.join(
        '<li><label><input type="checkbox" data-filter-size value="%s"><span>UK %s</span></label></li>' % (s, s)
        for s in ['6', '8', '10', '12', '14', '16', '18']
    )
    colors = ['Oat', 'Espresso', 'Chalk', 'Champagne', 'Mushroom', 'Maroon', 'Flax', 'Porcelain', 'Pearl', 'Taupe']
    hexes = {'Oat': '#D8C7B2', 'Espresso': '#2E2A26', 'Chalk': '#EDE8E1', 'Champagne': '#E3CBB7', 'Mushroom': '#A79A8D', 'Maroon': '#8C3A3A', 'Flax': '#C9B79F', 'Porcelain': '#F5F2ED', 'Pearl': '#EDE8E1', 'Taupe': '#B7A28B'}
    color_buttons = ''.join('<button class="filter-color" type="button" data-filter-color="%s" aria-label="Filter by %s" title="%s"><span style="background:%s"></span></button>' % (c, c, c, hexes[c]) for c in colors)
    return page_hero('The full edit', 'Shop all pieces', 'Considered womenswear, cloth by the metre and accessories. Filter by category, UK size, colour or price.', [('Home', 'index.html'), ('Shop', None)]) + '''
<section class="inner-section">
  <div class="container shop-layout">
    <aside class="filter-sidebar" aria-label="Product filters">
      <div class="filter-group"><h3>Category <i class="ph ph-caret-down"></i></h3><ul class="filter-list">%s</ul></div>
      <div class="filter-group"><h3>UK size <i class="ph ph-caret-down"></i></h3><ul class="filter-list">%s</ul></div>
      <div class="filter-group"><h3>Colour <i class="ph ph-caret-down"></i></h3><div class="filter-colors">%s</div></div>
      <div class="filter-group"><h3>Price <i class="ph ph-caret-down"></i></h3><input class="price-range" type="range" min="40" max="300" step="5" value="300" data-price-range><div class="price-range-values"><span>£40</span><strong data-price-output>£300</strong></div></div>
      <div class="filter-group"><h3>Offers <i class="ph ph-caret-down"></i></h3><ul class="filter-list"><li><label><input type="checkbox" data-filter-sale><span>Boxing Day Sale only</span></label></li></ul></div>
      <button class="btn-ghost btn-sm-editorial" type="button" data-clear-filters>Clear all filters <i class="ph ph-x"></i></button>
    </aside>
    <div>
      <div class="shop-toolbar">
        <div class="shop-toolbar__left"><span class="shop-toolbar__count" data-result-count>18 pieces</span><span class="small-copy">UK 6–18 · Free UK delivery over £120</span></div>
        <div class="shop-toolbar__right"><label class="visually-hidden" for="sortSelect">Sort products</label><select class="form-select" id="sortSelect" data-sort><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option></select></div>
      </div>
      <div class="active-filters" data-active-filters></div>
      %s
    </div>
  </div>
</section>''' % (category_boxes, size_boxes, color_buttons, product_grid('shop', 'product-grid', 0, 'data-shop-grid="true"'))


def category():
    return '''
<section class="category-hero">
  <div class="category-hero__media"><img data-category-image src="assets/images/category-ready.jpg" alt="Ready-to-Wear"><img data-category-hover src="assets/images/category-ready-hover.jpg" alt="" hidden></div>
  <div class="category-hero__copy">
    <div>
      <i class="category-hero__icon fa-solid fa-shirt" data-category-icon></i>
      %s
      <h1 data-category-title>Ready-to-Wear</h1>
      <p class="lede" data-category-description>Quiet tailoring, fluid dresses and separates cut in small runs from our Shoreditch atelier.</p>
      <a class="btn-editorial" href="shop.html">Shop the full edit <i class="ph ph-arrow-right"></i></a>
      <div class="category-chips">
        <a class="category-chip" data-category-chip="unstitched-fabric" href="category.html?c=unstitched-fabric">Fabric by the Metre</a>
        <a class="category-chip" data-category-chip="ready-to-wear" href="category.html?c=ready-to-wear">Ready-to-Wear</a>
        <a class="category-chip" data-category-chip="occasion" href="category.html?c=occasion">Occasion</a>
        <a class="category-chip" data-category-chip="accessories" href="category.html?c=accessories">Accessories</a>
      </div>
    </div>
  </div>
</section>
<section class="inner-section">
  <div class="container">
    <nav class="breadcrumb-editorial" aria-label="Breadcrumb"><a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><a href="shop.html">Shop</a><i class="fa-solid fa-chevron-right"></i><span data-breadcrumb-current>Ready-to-Wear</span></nav>
    <div class="section-head reveal"><div class="section-head__copy">%s<h2 data-category-tile>Ready-to-Wear</h2></div><div class="section-head__actions"><span class="shop-toolbar__count" data-category-count>12 pieces</span></div></div>
    %s
  </div>
</section>''' % (
        eyebrow('The everyday edit', 'eyebrow--dark'),
        eyebrow('Curated in Shoreditch'),
        product_grid('category', 'product-grid product-grid--4', 0, 'data-category-grid="true"')
    )


def product():
    return '''
<section class="pdp">
  <div class="container">
    <nav class="breadcrumb-editorial" aria-label="Breadcrumb"><a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><a href="shop.html">Shop</a><i class="fa-solid fa-chevron-right"></i><a data-pdp-breadcrumb-category href="category.html?c=ready-to-wear">Ready-to-Wear</a><i class="fa-solid fa-chevron-right"></i><span data-breadcrumb-current>Product</span></nav>
    <div class="pdp-layout">
      <div class="pdp-gallery" data-pdp-gallery></div>
      <div class="pdp-info" data-pdp-info></div>
    </div>
  </div>
</section>

<section class="section section--white section--line">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>Complete the look</h2></div><a class="text-link" href="shop.html">Shop all accessories <i class="ph ph-arrow-up-right"></i></a></div>
    %s
  </div>
</section>

%s

<section class="section section--white" id="reviews">
  <div class="container">
    %s
    <div class="pdp-reviews">
      <aside class="review-breakdown reveal">
        <span class="eyebrow">Verified reviews</span>
        <div class="review-breakdown__score" data-pdp-review-score>4.9</div>
        <div class="stars" style="margin-bottom:8px">★★★★★</div>
        <p class="small-copy" data-pdp-review-count>84 verified reviews</p>
        <div style="margin-top:26px">
          <div class="review-bar"><span>5 star</span><span class="review-bar__track"><span style="width:82%%"></span></span><span>82%%</span></div>
          <div class="review-bar"><span>4 star</span><span class="review-bar__track"><span style="width:13%%"></span></span><span>13%%</span></div>
          <div class="review-bar"><span>3 star</span><span class="review-bar__track"><span style="width:3%%"></span></span><span>3%%</span></div>
          <div class="review-bar"><span>2 star</span><span class="review-bar__track"><span style="width:1%%"></span></span><span>1%%</span></div>
          <div class="review-bar"><span>1 star</span><span class="review-bar__track"><span style="width:1%%"></span></span><span>1%%</span></div>
        </div>
        <button class="btn-outline btn-sm-editorial" type="button" style="margin-top:24px" data-toast="Thank you — review submissions open after purchase">Write a review</button>
      </aside>
      <div class="review-list" data-render="reviews" data-stagger></div>
    </div>
  </div>
</section>

<section class="section section--tight section--warm">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>Recently viewed</h2></div><a class="text-link" href="shop.html">Back to shop <i class="ph ph-arrow-up-right"></i></a></div>
    <div class="recently-viewed-strip" data-render="recently-viewed"></div>
  </div>
</section>

<div class="mobile-add-bar" data-mobile-add-bar>
  <div><strong class="small-copy" data-mobile-name>Product</strong><br><span class="price" data-mobile-price>£0</span></div>
  <button class="btn-editorial" type="button" data-mobile-add>Add to bag <i class="fa-solid fa-cart-plus"></i></button>
</div>''' % (
        eyebrow('Styled by the atelier'),
        product_grid('complete', 'product-grid product-grid--4', 4),
        carousel('related', 'You may also like', 'Related pieces', 'View category', 'shop.html', 8, 'section section--tight'),
        section_head('The verdict', 'Reviews & fit notes', 'What our clients say about the cut, cloth and finish.'),
        eyebrow('Your history')
    )


def quick_view():
    return page_hero('A faster way to look', 'Quick View', 'A shoppable preview without leaving the edit. The modal opens on this page and anywhere you tap a quick-view icon.', [('Home', 'index.html'), ('Quick View', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>Open a product preview</h2><p class="lede" style="margin-top:14px">Choose a piece below. Colour, UK size, quantity, wishlist and Add to Bag all work inside the modal.</p></div></div>
    <div class="row g-3 reveal">
      <div class="col-md-4"><button class="btn-outline w-100" type="button" data-open-quick-view="harrow-linen-blazer">Harrow Linen Blazer · £189</button></div>
      <div class="col-md-4"><button class="btn-outline w-100" type="button" data-open-quick-view="camellia-bias-midi-dress">Camellia Midi Dress · £129</button></div>
      <div class="col-md-4"><button class="btn-outline w-100" type="button" data-open-quick-view="redchurch-silk-slip-dress">Redchurch Silk Slip · £165</button></div>
    </div>
    <div style="margin-top:46px">%s</div>
  </div>
</section>''' % (eyebrow('Modal preview'), product_grid('new', 'product-grid product-grid--4', 4))


def cart():
    return page_hero('Your edit', 'Shopping Bag', 'The 400px slide-in drawer opens automatically here. Bag contents, quantity steppers and subtotal are stored locally in your browser.', [('Home', 'index.html'), ('Bag', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="row g-4 align-items-start">
      <div class="col-lg-8 reveal">
        <div class="section-head"><div class="section-head__copy">%s<h2>Bag contents</h2></div><button class="btn-outline btn-sm-editorial" type="button" data-open-cart>Open bag drawer <i class="fa-solid fa-bag-shopping"></i></button></div>
        <div data-cart-table></div>
      </div>
      <div class="col-lg-4 reveal">
        <aside class="checkout-summary" style="position:static">
          <h2>Summary</h2>
          <div class="checkout-totals__row"><span>Items</span><strong data-cart-count-text>0 items</strong></div>
          <div class="checkout-totals__row"><span>Subtotal</span><strong data-cart-subtotal>£0</strong></div>
          <div class="checkout-totals__row"><span>UK delivery</span><strong>Free over £120</strong></div>
          <div class="checkout-totals__row checkout-totals__row--total"><span>VAT included</span><strong>All prices</strong></div>
          <a class="btn-editorial w-100" href="checkout.html" data-checkout-button>Proceed to checkout <i class="fa-solid fa-lock"></i></a>
          <a class="text-link" href="shop.html" style="margin-top:20px">Continue shopping <i class="ph ph-arrow-up-right"></i></a>
        </aside>
      </div>
    </div>
  </div>
</section>''' % eyebrow('Locally saved')


def checkout():
    return page_hero('Almost yours', 'Checkout', 'A calm, two-column checkout with a sticky order summary, VAT included and Klarna 3-split.', [('Home', 'index.html'), ('Bag', 'cart.html'), ('Checkout', None)]) + '''
<section class="inner-section">
  <div class="container checkout-layout">
    <div>
      <div class="form-alert" data-checkout-empty style="display:none">Your bag is empty. <a class="text-link" href="shop.html">Add a piece</a> before placing an order.</div>
      <div class="form-success" data-checkout-success hidden><span class="eyebrow">Order received</span><h2>Thank you.</h2><p>Your demonstration order <strong data-order-number>LL-000000</strong> has been placed. No payment was taken and no data left your browser.</p><a class="text-link" href="shop.html">Continue shopping <i class="ph ph-arrow-up-right"></i></a></div>
      <form data-checkout-form>
        <section class="checkout-form-section"><h2><span>1</span> Contact</h2><div class="row g-3"><div class="col-md-6"><label class="form-label" for="firstName">First name</label><input class="form-control" id="firstName" name="firstName" required></div><div class="col-md-6"><label class="form-label" for="lastName">Last name</label><input class="form-control" id="lastName" name="lastName" required></div><div class="col-md-7"><label class="form-label" for="email">Email</label><input class="form-control" id="email" type="email" name="email" required></div><div class="col-md-5"><label class="form-label" for="phone">Phone</label><input class="form-control" id="phone" type="tel" name="phone" placeholder="+44"></div></div></section>
        <section class="checkout-form-section"><h2><span>2</span> Delivery address</h2><div class="row g-3"><div class="col-12"><label class="form-label" for="address">Address</label><input class="form-control" id="address" name="address" required></div><div class="col-md-5"><label class="form-label" for="city">City</label><input class="form-control" id="city" name="city" required></div><div class="col-md-4"><label class="form-label" for="postcode">Postcode</label><input class="form-control" id="postcode" name="postcode" required></div><div class="col-md-3"><label class="form-label" for="country">Country</label><select class="form-select" id="country" name="country"><option>United Kingdom</option><option>Ireland</option><option>France</option><option>Germany</option><option>Netherlands</option><option>Spain</option><option>Italy</option></select></div></div></section>
        <section class="checkout-form-section"><h2><span>3</span> Delivery</h2><div class="payment-methods">
          <label class="payment-method"><input type="radio" name="shipping" value="0" data-shipping checked><div><strong>Royal Mail Tracked 48</strong><small>Free UK delivery over £120 · 2–3 working days</small></div><i class="fa-solid fa-truck-fast payment-method__icons"></i></label>
          <label class="payment-method"><input type="radio" name="shipping" value="6.95" data-shipping><div><strong>Royal Mail Next Day</strong><small>Order before 14:00 · £6.95</small></div><i class="fa-solid fa-truck-fast payment-method__icons"></i></label>
          <label class="payment-method"><input type="radio" name="shipping" value="12" data-shipping><div><strong>EU tracked delivery</strong><small>3–6 working days · £12.00 · VAT included</small></div><i class="fa-solid fa-globe payment-method__icons"></i></label>
        </div></section>
        <section class="checkout-form-section"><h2><span>4</span> Payment</h2><div class="payment-methods">
          <label class="payment-method"><input type="radio" name="payment" value="card" checked><div><strong>Card</strong><small>Visa, Mastercard, Amex</small></div><span class="payment-method__icons"><i class="fa-brands fa-cc-visa"></i> <i class="fa-brands fa-cc-mastercard"></i> <i class="fa-brands fa-cc-amex"></i></span></label>
          <label class="payment-method"><input type="radio" name="payment" value="paypal"><div><strong>PayPal</strong><small>Pay with your PayPal balance</small></div><i class="fa-brands fa-cc-paypal payment-method__icons"></i></label>
          <label class="payment-method"><input type="radio" name="payment" value="klarna"><div><strong>Klarna · Pay in 3</strong><small>Three interest-free instalments</small></div><span class="klarna-badge">Klarna.</span></label>
          <label class="payment-method"><input type="radio" name="payment" value="applepay"><div><strong>Apple Pay</strong><small>Fast, secure checkout</small></div><i class="fa-brands fa-apple-pay payment-method__icons"></i></label>
        </div><p class="small-copy" style="margin-top:16px"><i class="fa-solid fa-lock"></i> This is a front-end demonstration. No payment is processed and no card details are stored.</p></section>
        <button class="btn-editorial" type="submit">Place order <i class="fa-solid fa-lock"></i></button>
      </form>
    </div>
    <aside class="checkout-summary reveal">
      <div style="display:flex;justify-content:space-between;align-items:center"><h2>Order summary</h2><span class="small-copy" data-checkout-count>0 items</span></div>
      <div data-checkout-items></div>
      <div class="checkout-totals">
        <div class="checkout-totals__row"><span>Subtotal</span><strong data-checkout-subtotal>£0</strong></div>
        <div class="checkout-totals__row"><span>Delivery</span><strong data-checkout-shipping>Free</strong></div>
        <div class="checkout-totals__row"><span>VAT (20%)</span><strong data-checkout-vat>£0 included</strong></div>
        <div class="checkout-totals__row checkout-totals__row--total"><span>Total</span><strong data-checkout-total>£0</strong></div>
      </div>
      <div class="vat-note"><i class="fa-solid fa-circle-info"></i> All displayed prices include UK VAT. EU orders are shipped DDP where applicable; no additional VAT is requested on delivery.</div>
      <div class="klarna-split"><div class="klarna-split__top"><strong>Klarna. Pay in 3</strong><span class="small-copy" data-klarna-total>£0</span></div><div class="klarna-split__payments"><span>Today<br><strong data-klarna-split>£0</strong></span><span>Month 1<br><strong data-klarna-split>£0</strong></span><span>Month 2<br><strong data-klarna-split>£0</strong></span></div></div>
      <p class="small-copy" style="margin-top:16px"><i class="fa-solid fa-rotate-left"></i> Free 28-day UK returns · <a href="shipping-returns.html">Full policy</a></p>
    </aside>
  </div>
</section>'''


def wishlist():
    return page_hero('Saved for later', 'Your Wishlist', 'The pieces you have kept close. Saved locally in your browser, ready to move into your bag.', [('Home', 'index.html'), ('Wishlist', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>Saved pieces</h2></div><div class="section-head__actions"><button class="btn-outline btn-sm-editorial" type="button" data-move-all-to-bag>Move all to bag <i class="fa-solid fa-cart-plus"></i></button><button class="btn-ghost btn-sm-editorial" type="button" data-share-wishlist>Share <i class="fa-solid fa-share-nodes"></i></button><button class="btn-ghost btn-sm-editorial" type="button" data-clear-wishlist>Clear all</button></div></div>
    %s
  </div>
</section>''' % (eyebrow('A considered shortlist'), product_grid('wishlist', 'product-grid product-grid--4', 0, '', 'Your wishlist is waiting. Tap the heart on any piece to save it here.'))


def about():
    return page_hero('Our craft', 'Made slowly, in Shoreditch', 'LINEN & LOOM is a small London atelier built around a simple idea: choose the cloth first, then make fewer, better pieces.', [('Home', 'index.html'), ('Our Craft', None)]) + '''
<section class="inner-section">
  <div class="container split-media-copy">
    <div class="reveal"><img src="assets/images/about-atelier.jpg" alt="Tailor working in the LINEN & LOOM atelier" loading="lazy"></div>
    <div class="prose reveal">%s<h2>A working studio, not a concept</h2><p>We began with a table, two rolls of Belgian linen and a frustration with clothes that looked beautiful for one season and felt forgettable the next. Today the studio is a little larger, but the order of decisions has not changed: cloth, cut, finish.</p><p>Every collection is made in small runs at 48 Redchurch Street. We grade to UK sizes 6–18, keep our palette deliberately narrow, and leave enough room in the pattern for a real day — a commute, a long lunch, a last-minute evening.</p><a class="btn-editorial" href="shop.html">Shop the collection <i class="ph ph-arrow-right"></i></a></div>
  </div>
</section>
<section class="inner-section inner-section--white">
  <div class="container">
    <div class="stat-row reveal"><div class="stat"><strong>2018</strong><span>Founded in London</span></div><div class="stat"><strong>6–18</strong><span>UK size range</span></div><div class="stat"><strong>8</strong><span>Core cloths</span></div><div class="stat"><strong>28</strong><span>Day free UK returns</span></div></div>
  </div>
</section>
<section class="inner-section">
  <div class="container row g-5 align-items-start">
    <div class="col-lg-5 reveal">%s<h2>How a piece happens</h2><p class="lede">From the first swatch to the final press, nothing leaves the studio without being handled by someone who knows the whole garment.</p><img src="assets/images/story-weaving.jpg" alt="Hands weaving cloth" style="width:100%%;aspect-ratio:4/3;object-fit:cover;margin-top:28px" loading="lazy"></div>
    <div class="col-lg-7 reveal"><div class="timeline">
      <div class="timeline-item"><strong>01 / Cloth</strong><h3>We choose the hand-feel</h3><p>Weight, slub, drape and how the surface will soften. We buy only what we can cut.</p></div>
      <div class="timeline-item"><strong>02 / Pattern</strong><h3>We draft for real proportions</h3><p>Toiles are fitted on real bodies, then graded across UK 6–18 with consistent ease.</p></div>
      <div class="timeline-item"><strong>03 / Cut</strong><h3>Small batches only</h3><p>Fabric is rested, cut by hand and matched so the grain falls correctly on every panel.</p></div>
      <div class="timeline-item"><strong>04 / Finish</strong><h3>Pressed, checked, wrapped</h3><p>Horn buttons, clean seams, a final press and a linen dust bag. Then it is ready.</p></div>
    </div></div>
  </div>
</section>
<section class="inner-section inner-section--warm"><div class="container">%s</div></section>
<section class="inner-section inner-section--white"><div class="container split-media-copy"><div class="prose reveal">%s<h2>Come and see the cloth</h2><p>48 Redchurch St, Shoreditch, London E2 7DP. Appointments Tuesday to Saturday, walk-ins welcome for fabric and accessories.</p><p class="pull-quote">“The best clothes become part of your life quietly.”</p><a class="btn-outline" href="contact.html">Book a fitting <i class="ph ph-arrow-right"></i></a></div><div class="reveal"><img src="assets/images/about-london.jpg" alt="London street near the atelier" loading="lazy"></div></div></section>''' % (eyebrow('Since 2018'), eyebrow('The process'), values_row(), eyebrow('Visit us'))


def lookbook_page():
    return page_hero('Winter 2026', 'The Lookbook', 'Six quiet looks, photographed in and around the Shoreditch atelier. A study in oat, chalk, champagne and espresso.', [('Home', 'index.html'), ('Lookbook', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>The Winter Edit</h2><p class="lede" style="margin-top:14px">Tailoring softened by linen, silk kept deliberately plain, and one good tote that goes with everything.</p></div><a class="text-link" href="shop.html">Shop the edit <i class="ph ph-arrow-up-right"></i></a></div>
    <div class="lookbook-page-grid" data-render="lookbook-page" data-stagger></div>
  </div>
</section>
<section class="inner-section inner-section--white"><div class="container"><div class="section-head reveal"><div class="section-head__copy">%s<h2>Behind the frames</h2></div></div><div class="row g-4"><div class="col-md-4 reveal"><img src="assets/images/atelier-rack.jpg" alt="Neutral garments on a rail" style="width:100%%;aspect-ratio:3/4;object-fit:cover"><p class="small-copy" style="margin-top:12px">The rail: six looks, one palette.</p></div><div class="col-md-4 reveal"><img src="assets/images/story-atelier.jpg" alt="Sewing machine in the atelier" style="width:100%%;aspect-ratio:3/4;object-fit:cover"><p class="small-copy" style="margin-top:12px">Final adjustments before the shoot.</p></div><div class="col-md-4 reveal"><img src="assets/images/london-brick.jpg" alt="London brick and street lamp" style="width:100%%;aspect-ratio:3/4;object-fit:cover"><p class="small-copy" style="margin-top:12px">A Shoreditch afternoon, just off Redchurch Street.</p></div></div></div></section>''' % (eyebrow('Look 01 — 06'), eyebrow('Studio notes'))


def size_guide():
    return page_hero('Size & fit', 'UK Size Guide', 'UK 6–18, with EU and US conversions and body measurements in centimetres. Fit notes from the atelier included.', [('Home', 'index.html'), ('Size Guide', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>Conversion & measurements</h2></div><button class="btn-outline btn-sm-editorial" type="button" data-open-size-chart>Open chart modal <i class="fa-solid fa-ruler"></i></button></div>
    <div class="table-responsive reveal"><table class="table size-table"><thead><tr><th>UK</th><th>EU</th><th>US</th><th>Bust</th><th>Waist</th><th>Hip</th></tr></thead><tbody data-render="size-rows" data-cols="full"></tbody></table></div>
    <p class="small-copy" style="margin-top:16px">Measurements are body measurements, not garment measurements. Our relaxed styles include additional ease.</p>
  </div>
</section>
<section class="inner-section inner-section--white">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>How to measure</h2></div></div>
    <div class="measure-grid" data-stagger>
      <div class="measure-card"><i class="fa-solid fa-ruler-horizontal"></i><h3>Bust</h3><p>Keep the tape level and measure around the fullest part, over the underwear you would normally wear.</p></div>
      <div class="measure-card"><i class="fa-solid fa-ruler"></i><h3>Waist</h3><p>Measure around the narrowest part of your natural waist. Do not pull the tape tight.</p></div>
      <div class="measure-card"><i class="fa-solid fa-ruler-vertical"></i><h3>Hip</h3><p>Stand with feet together and measure around the fullest part of the hip and seat.</p></div>
    </div>
  </div>
</section>
<section class="inner-section inner-section--warm"><div class="container split-media-copy"><div class="prose reveal">%s<h2>Fit notes from the studio</h2><ul><li>Tailored pieces are true to size; size up only if you prefer a softer line.</li><li>Bias dresses skim rather than cling — choose your usual UK size.</li><li>Fabric by the metre is sold in one continuous length across multiple metres.</li><li>Between sizes? Our atelier usually recommends the larger size for linen, which relaxes beautifully with wear.</li></ul><p>Still unsure? Call <a href="tel:+442079460958">+44 20 7946 0958</a> or <a class="text-link" href="contact.html">send a fit note</a>.</p></div><div class="reveal"><img src="assets/images/blog-linen.jpg" alt="Soft linen cloth" loading="lazy"></div></div></section>''' % (eyebrow('UK / EU / US'), eyebrow('Measure well'), eyebrow('A quiet word on fit'))


def blog():
    return page_hero('The journal', 'Notes from the atelier', 'Cloth, craft, London and the small decisions behind a considered wardrobe.', [('Home', 'index.html'), ('Journal', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="section-head reveal"><div class="section-head__copy">%s<h2>Latest stories</h2></div><a class="text-link" href="blog-single.html">Read the featured story <i class="ph ph-arrow-up-right"></i></a></div>
    <div class="blog-grid" data-render="blog-all" data-stagger></div>
  </div>
</section>
%s''' % (eyebrow('Craft · Style · London'), newsletter())


def blog_single():
    return page_hero('Journal · Craft', 'The quiet art of weaving', 'Inside the looms, hands and slow decisions behind a cloth that is made to be kept.', [('Home', 'index.html'), ('Journal', 'blog.html'), ('The quiet art of weaving', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-9">
        <div class="reveal" style="margin-bottom:34px"><img data-blog-hero src="assets/images/blog-single-hero.jpg" alt="The quiet art of weaving" style="width:100%%;aspect-ratio:16/9;object-fit:cover"></div>
        <div class="blog-card__meta" style="margin-bottom:18px"><span data-blog-category>Craft</span> · <span data-blog-date>18 October 2026</span> · <span data-blog-readtime>6 min read</span> · By <span data-blog-author>Elena Marsh</span></div>
        <article class="prose" style="margin-inline:auto" data-blog-article-body></article>
        <div class="pdp-share" style="margin-top:40px"><span>Share</span><a href="#" data-toast="Share on Instagram" aria-label="Share on Instagram"><i class="fa-brands fa-instagram"></i></a><a href="#" data-toast="Share on Pinterest" aria-label="Share on Pinterest"><i class="fa-brands fa-pinterest-p"></i></a><a href="#" data-toast="Share on Facebook" aria-label="Share on Facebook"><i class="fa-brands fa-facebook-f"></i></a><a href="#" data-copy-article aria-label="Copy article link"><i class="fa-solid fa-link"></i></a></div>
      </div>
    </div>
  </div>
</section>
<section class="inner-section inner-section--white"><div class="container"><div class="section-head reveal"><div class="section-head__copy">%s<h2>Keep reading</h2></div><a class="text-link" href="blog.html">All stories <i class="ph ph-arrow-up-right"></i></a></div><div class="blog-grid" data-render="related-posts" data-stagger></div></div></section>''' % eyebrow('More from the journal')


def faq():
    qs = [
        ('How long does UK delivery take?', 'Royal Mail Tracked 48 is free on orders over £120 and usually arrives in 2–3 working days. Next Day delivery is £6.95 when ordered before 14:00. EU tracked delivery is £12.00 and typically takes 3–6 working days.'),
        ('What is your returns policy?', 'We offer free 28-day UK returns on unworn pieces with tags attached. Start a return from your order confirmation or contact the atelier; a prepaid Royal Mail label is emailed to you. EU returns are accepted within 28 days, with return postage paid by the customer.'),
        ('Which sizes do you stock?', 'Our clothing is graded to UK sizes 6–18. Each product page links to the full UK/EU/US conversion chart and includes a fit note. Accessories are one size; cloth by the metre is sold in continuous lengths.'),
        ('Is VAT included in the price?', 'Yes. Every displayed GBP price includes UK VAT at 20%. The checkout shows the VAT portion explicitly. EU orders are shipped DDP where applicable, so no extra VAT is requested on delivery.'),
        ('Can I pay with Klarna?', 'Yes. Klarna Pay in 3 splits the order total into three interest-free instalments. Visa, Mastercard, Amex, PayPal and Apple Pay are also available at checkout.'),
        ('How should I care for linen?', 'Wash cool on a gentle cycle or by hand, skip fabric softener and line dry. Press on the reverse with a warm iron. A lived-in crease is part of linen’s character.'),
        ('Do you ship outside the UK?', 'We currently ship across the EU. Delivery is calculated at checkout and tracking is provided by email once the piece leaves the Shoreditch atelier.'),
        ('How do I use my cookie preferences?', 'Use the GDPR panel at the bottom of the page, or the “Cookie preferences” link in the footer. Essential cookies keep the bag and wishlist working; analytics and marketing are optional and off unless you choose them.'),
        ('Can I visit the atelier?', 'Yes — 48 Redchurch St, Shoreditch, London E2 7DP. Tuesday to Saturday, 10:00–18:00. Fittings are best booked ahead via the contact page.')
    ]
    items = ''.join('''<div class="faq-item" data-faq-item><h2 class="accordion-header"><button class="accordion-button%s" type="button" data-bs-toggle="collapse" data-bs-target="#faq%d" aria-expanded="%s">%s</button></h2><div id="faq%d" class="accordion-collapse collapse%s" data-bs-parent="#faqAccordion"><div class="accordion-body">%s</div></div></div>''' % (' collapsed' if i else '', i, 'true' if i == 0 else 'false', q, i, ' show' if i == 0 else '', a) for i, (q, a) in enumerate(qs))
    return page_hero('Help', 'Frequently asked questions', 'Delivery, returns, sizing, payments and cloth care — answered plainly.', [('Home', 'index.html'), ('FAQ', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="row justify-content-center"><div class="col-lg-9">
      <label class="form-label" for="faqSearch">Search the FAQ</label><input class="form-control faq-search" id="faqSearch" type="search" data-faq-search placeholder="Try “returns”, “Klarna” or “linen”">
      <div class="accordion" id="faqAccordion">%s</div>
      <div class="empty-state" data-faq-empty hidden><i class="fa-solid fa-magnifying-glass"></i><h3>No matching question</h3><p>Try a different word, or <a class="text-link" href="contact.html">ask the atelier</a>.</p></div>
      <p class="small-copy" style="margin-top:30px">Still need help? Call <a href="tel:+442079460958">+44 20 7946 0958</a> or <a class="text-link" href="contact.html">send a note</a>.</p>
    </div></div>
  </div>
</section>''' % items


def shipping_returns():
    return page_hero('Help', 'Shipping & Returns', 'Free UK delivery over £120, free 28-day UK returns, EU delivery and VAT included in every price.', [('Home', 'index.html'), ('Shipping & Returns', None)]) + '''
<section class="inner-section">
  <div class="container prose">
    %s
    <h2>Delivery at a glance</h2>
    <div class="table-responsive"><table class="table info-table"><thead><tr><th>Service</th><th>Cost</th><th>Estimated arrival</th></tr></thead><tbody><tr><td>UK · Royal Mail Tracked 48</td><td>Free over £120 · £4.95 below</td><td>2–3 working days</td></tr><tr><td>UK · Royal Mail Next Day</td><td>£6.95</td><td>Next working day before 14:00</td></tr><tr><td>EU · Tracked</td><td>£12.00</td><td>3–6 working days</td></tr></tbody></table></div>
    <h2>VAT & EU orders</h2>
    <p>All displayed prices are in GBP and include UK VAT at 20%%. The checkout breaks out the VAT portion. Where we ship DDP, duties and VAT are handled before dispatch so there is nothing extra to pay on delivery.</p>
    <h2>Free 28-day UK returns</h2>
    <p>Return unworn pieces with tags attached within 28 days. Contact the atelier with your order number and we will email a prepaid Royal Mail label. Refunds are issued to the original payment method within 5 working days of the return reaching us.</p>
    <h2>How to return</h2>
    <ol><li>Email <a href="mailto:hello@linenandloom.co.uk">hello@linenandloom.co.uk</a> or call +44 20 7946 0958 with your order number.</li><li>Place the piece in its original linen dust bag or a plain recyclable parcel.</li><li>Attach the prepaid label and drop it at any Royal Mail parcel point.</li><li>We email you when it arrives and when the refund is released.</li></ol>
    <h2>Exchanges</h2>
    <p>Need a different UK size? Return the original and place a new order, or ask the atelier to hold the replacement size for 48 hours while your return travels.</p>
  </div>
</section>
<section class="inner-section inner-section--white"><div class="container">%s</div></section>''' % (eyebrow('The practical details'), trust_row())


def track_order():
    return page_hero('Help', 'Track your order', 'Enter the order number from your confirmation email and the email address used at checkout.', [('Home', 'index.html'), ('Track Order', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="row g-5">
      <div class="col-lg-5 reveal">
        <div class="contact-card">
          %s
          <h2>Order lookup</h2>
          <form data-track-form>
            <div style="margin-bottom:16px"><label class="form-label" for="orderNo">Order number</label><input class="form-control" id="orderNo" name="order" placeholder="LL-123456" required></div>
            <div style="margin-bottom:20px"><label class="form-label" for="trackEmail">Email address</label><input class="form-control" id="trackEmail" name="email" type="email" required></div>
            <button class="btn-editorial w-100" type="submit">Track order <i class="ph ph-arrow-right"></i></button>
          </form>
          <p class="small-copy" style="margin-top:16px"><i class="fa-solid fa-lock"></i> Demonstration lookup only — no data is sent anywhere.</p>
        </div>
      </div>
      <div class="col-lg-7 reveal">
        <div class="empty-state" style="border-style:solid"><i class="fa-solid fa-truck-fast"></i><h3>Your parcel, step by step</h3><p>Enter an order number to see a sample Royal Mail timeline.</p></div>
        <div class="form-success" data-track-result hidden style="margin-top:20px">
          <span class="eyebrow">Demo tracking</span><h2>Order <span data-track-order>LL-000000</span></h2><p class="small-copy">Status for <span data-track-email>you@example.com</span> · Royal Mail Tracked 48</p>
          <div class="track-timeline">
            <div class="track-step is-done"><strong>Order placed</strong><p>Received at the Shoreditch atelier.</p></div>
            <div class="track-step is-done"><strong>Picked & wrapped</strong><p>Checked against the original sample and packed in a linen dust bag.</p></div>
            <div class="track-step is-done"><strong>With Royal Mail</strong><p>Tracked 48 · estimated delivery in 2 working days.</p></div>
            <div class="track-step"><strong>Out for delivery</strong><p>We will email tracking updates as the parcel moves.</p></div>
            <div class="track-step"><strong>Delivered</strong><p>Free 28-day UK returns begin on delivery.</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>''' % eyebrow('Royal Mail tracked')


def contact():
    return page_hero('Get in touch', 'Contact the atelier', 'Fit advice, fabric questions, appointments and order help — a real person replies from Shoreditch.', [('Home', 'index.html'), ('Contact', None)]) + '''
<section class="inner-section">
  <div class="container">
    <div class="row g-5 align-items-start">
      <div class="col-lg-7 reveal">
        %s
        <h2 style="margin-bottom:24px">Send us a note</h2>
        <div class="form-success" data-contact-success hidden style="margin-bottom:20px"><h3>Thank you.</h3><p>Your note has been received in this demonstration. The atelier normally replies within one working day.</p></div>
        <form data-contact-form>
          <div class="row g-3"><div class="col-md-6"><label class="form-label" for="contactName">Name</label><input class="form-control" id="contactName" name="name" required></div><div class="col-md-6"><label class="form-label" for="contactEmail">Email</label><input class="form-control" id="contactEmail" name="email" type="email" required></div><div class="col-md-6"><label class="form-label" for="contactTopic">Topic</label><select class="form-select" id="contactTopic" name="topic"><option>Fit & sizing</option><option>Fabric by the metre</option><option>Order or return</option><option>Atelier appointment</option><option>Press</option></select></div><div class="col-md-6"><label class="form-label" for="contactOrder">Order number (optional)</label><input class="form-control" id="contactOrder" name="order" placeholder="LL-123456"></div><div class="col-12"><label class="form-label" for="contactMessage">Message</label><textarea class="form-control" id="contactMessage" name="message" required></textarea></div></div>
          <button class="btn-editorial" type="submit" style="margin-top:22px">Send message <i class="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
      <div class="col-lg-5 reveal">
        <div class="contact-card">
          <div class="contact-detail"><i class="fa-solid fa-map-pin"></i><div><strong>Shoreditch atelier</strong><span>48 Redchurch St, Shoreditch, London E2 7DP</span></div></div>
          <div class="contact-detail"><i class="fa-solid fa-phone"></i><div><strong>Telephone</strong><span><a href="tel:+442079460958">+44 20 7946 0958</a></span></div></div>
          <div class="contact-detail"><i class="fa-solid fa-envelope"></i><div><strong>Email</strong><span><a href="mailto:hello@linenandloom.co.uk">hello@linenandloom.co.uk</a></span></div></div>
          <div class="contact-detail"><i class="fa-solid fa-clock"></i><div><strong>Opening hours</strong><span>Tue–Sat 10:00–18:00 · Sunday by appointment</span></div></div>
          <img src="assets/images/london-street.jpg" alt="Red brick London street near the atelier" style="width:100%%;aspect-ratio:4/3;object-fit:cover;margin-top:24px" loading="lazy">
        </div>
      </div>
    </div>
  </div>
</section>''' % eyebrow('We read every note')


def not_found():
    return '''
<section class="section error-page">
  <div class="container error-page">
    <div class="reveal">
      <span class="error-page__code">404</span>
      %s
      <h1>This thread has wandered.</h1>
      <p class="lede">The page you were looking for is no longer in the edit. Let us take you back to something beautifully made.</p>
      <div class="hero-actions"><a class="btn-editorial" href="index.html">Return home <i class="ph ph-arrow-right"></i></a><button class="btn-outline" type="button" data-open-search>Search the shop <i class="fa-solid fa-magnifying-glass"></i></button></div>
    </div>
    <div class="reveal"><img src="assets/images/lookbook-01.jpg" alt="LINEN & LOOM editorial look" loading="lazy"></div>
  </div>
</section>''' % eyebrow('Page not found')


page('index.html', 'LINEN & LOOM | Premium Womenswear, London', 'Premium womenswear, considered fabric and a Shoreditch atelier. Free UK delivery over £120 and free 28-day UK returns.', 'home', home(), ['assets/js/home.js'])
page('shop.html', 'Shop All | LINEN & LOOM', 'Shop the full LINEN & LOOM edit with filters for category, UK size, colour and price.', 'shop', shop(), ['assets/js/shop.js'])
page('category.html', 'Category | LINEN & LOOM', 'Explore Unstitched Fabric, Ready-to-Wear, Occasion and Accessories from LINEN & LOOM.', 'category', category(), ['assets/js/category.js'])
page('product.html', 'Product Detail | LINEN & LOOM', 'Product detail with UK sizes, cloth notes, quick add, reviews and complete-the-look styling.', 'product', product(), ['assets/js/product.js'])
page('quick-view.html', 'Quick View | LINEN & LOOM', 'Open a shoppable quick-view modal with colour, UK size, quantity and Add to Bag.', 'quick-view', quick_view(), [], 'quick-view')
page('cart.html', 'Shopping Bag | LINEN & LOOM', 'Your LINEN & LOOM shopping bag with quantity steppers, subtotal and checkout.', 'cart', cart(), [], 'cart')
page('checkout.html', 'Checkout | LINEN & LOOM', 'Two-column checkout with Klarna Pay in 3, VAT included and secure payment options.', 'checkout', checkout(), ['assets/js/checkout.js'])
page('wishlist.html', 'Wishlist | LINEN & LOOM', 'Your locally saved LINEN & LOOM wishlist.', 'wishlist', wishlist())
page('about.html', 'Our Craft | LINEN & LOOM', 'Inside the Shoreditch atelier: cloth, cut, finish and the LINEN & LOOM making process.', 'about', about())
page('lookbook.html', 'Lookbook | LINEN & LOOM', 'The LINEN & LOOM Winter 2026 lookbook, photographed in Shoreditch.', 'lookbook', lookbook_page())
page('size-guide.html', 'Size Guide | LINEN & LOOM', 'UK 6–18 size guide with EU/US conversions and body measurements.', 'size-guide', size_guide())
page('blog.html', 'Journal | LINEN & LOOM', 'Notes from the LINEN & LOOM atelier on cloth, craft, London and style.', 'blog', blog())
page('blog-single.html', 'The quiet art of weaving | LINEN & LOOM Journal', 'A LINEN & LOOM journal story about looms, cloth and slow decisions.', 'blog-single', blog_single())
page('faq.html', 'FAQ | LINEN & LOOM', 'Delivery, returns, sizing, payments, VAT, cloth care and GDPR cookie questions.', 'faq', faq())
page('shipping-returns.html', 'Shipping & Returns | LINEN & LOOM', 'Free UK delivery over £120, free 28-day UK returns, EU shipping and VAT information.', 'shipping-returns', shipping_returns())
page('track-order.html', 'Track Order | LINEN & LOOM', 'Track a LINEN & LOOM order with a Royal Mail status timeline.', 'track-order', track_order())
page('contact.html', 'Contact | LINEN & LOOM', 'Contact the Shoreditch atelier at 48 Redchurch St, London E2 7DP.', 'contact', contact())
page('404.html', 'Page not found | LINEN & LOOM', 'The requested LINEN & LOOM page could not be found.', '404', not_found())
