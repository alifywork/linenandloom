/* LINEN & LOOM — global shell, commerce state, overlays and local interactions. */
(function () {
  'use strict';

  const D = window.LL_DATA;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  /* Non-visual DOM environments (and some embedded previews) report zero layout.
     GSAP's ticker/ScrollTrigger can spin indefinitely there, so motion is only
     enabled once the document has a measurable box. Real browsers always do. */
  const hasLayout = document.documentElement.clientHeight > 0 &&
    (((document.documentElement.scrollHeight || 0) > 0) ||
     (((document.body && document.body.scrollHeight) || 0) > 0));
  const motionOK = hasGSAP && !reduceMotion && hasLayout;
  const hasScrollTrigger = motionOK && typeof window.ScrollTrigger !== 'undefined';
  const hasDraggable = motionOK && typeof window.Draggable !== 'undefined';
  if (motionOK && (hasScrollTrigger || hasDraggable)) {
    const plugins = [];
    if (hasScrollTrigger) plugins.push(window.ScrollTrigger);
    if (hasDraggable) plugins.push(window.Draggable);
    window.gsap.registerPlugin.apply(window.gsap, plugins);
  }

  const KEYS = {
    cart: 'll_cart',
    wishlist: 'll_wishlist',
    recent: 'll_recent',
    consent: 'll_cookie_consent',
    newsletter: 'll_newsletter'
  };

  const LL = {
    data: D,
    ready: false,
    reduceMotion: reduceMotion,
    hasGSAP: hasGSAP,
    hasLayout: hasLayout,
    motionOK: motionOK,
    gsap: window.gsap,
    ScrollTrigger: hasScrollTrigger ? window.ScrollTrigger : undefined,
    Draggable: hasDraggable ? window.Draggable : undefined,
    keys: KEYS
  };
  window.LL = LL;

  /* ---------------------------------------------------------------- utils */
  function read(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (err) { return fallback; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* private mode */ }
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function money(n) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: 'GBP',
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(n);
  }
  function priceHTML(p, extraClass) {
    const suffix = p.slug === 'unstitched-fabric' ? '<small class="muted"> / metre</small>' : '';
    const old = p.oldPrice ? '<span class="price__old">' + money(p.oldPrice) + '</span>' : '';
    return '<span class="price ' + (extraClass || '') + '">' + money(p.price) + suffix + old + '</span>';
  }
  function occasionSlug(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '-');
  }
  function sortProducts(list, sort) {
    const arr = list.slice();
    if (sort === 'price-asc') arr.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-desc') arr.sort(function (a, b) { return b.price - a.price; });
    else if (sort === 'rating') arr.sort(function (a, b) { return b.rating - a.rating; });
    else if (sort === 'newest') arr.sort(function (a, b) { return Number(b.isNew) - Number(a.isNew) || b.reviewCount - a.reviewCount; });
    else arr.sort(function (a, b) { return Number(b.isBestseller) - Number(a.isBestseller) || b.rating - a.rating; });
    return arr;
  }
  function filterProducts(filters) {
    filters = filters || {};
    return D.products.filter(function (p) {
      if (filters.categories && filters.categories.length && filters.categories.indexOf(p.slug) === -1) return false;
      if (filters.sizes && filters.sizes.length && !p.sizes.some(function (s) { return filters.sizes.indexOf(s) !== -1; })) return false;
      if (filters.colors && filters.colors.length && !p.colors.some(function (c) { return filters.colors.indexOf(c.name) !== -1; })) return false;
      if (typeof filters.maxPrice === 'number' && p.price > filters.maxPrice) return false;
      if (filters.sale && !p.sale) return false;
      if (filters.occasion && occasionSlug(p.occasion) !== filters.occasion) return false;
      return true;
    });
  }
  LL.escapeHTML = escapeHTML;
  LL.money = money;
  LL.priceHTML = priceHTML;
  LL.occasionSlug = occasionSlug;
  LL.sortProducts = sortProducts;
  LL.filterProducts = filterProducts;
  LL.getProduct = function (id) { return D.byId(id); };

  /* ------------------------------------------------------------- storage */
  LL.getCart = function () {
    const cart = read(KEYS.cart, []);
    return Array.isArray(cart) ? cart.filter(function (item) { return item && D.byId(item.id); }) : [];
  };
  LL.getWishlist = function () {
    const list = read(KEYS.wishlist, []);
    return Array.isArray(list) ? list.filter(function (id) { return D.byId(id); }) : [];
  };
  LL.getRecent = function () {
    const list = read(KEYS.recent, []);
    return Array.isArray(list) ? list.filter(function (id) { return D.byId(id); }) : [];
  };
  LL.getConsent = function () { return read(KEYS.consent, null); };
  LL.isWishlisted = function (id) { return LL.getWishlist().indexOf(id) !== -1; };
  LL.cartCount = function () { return LL.getCart().reduce(function (sum, item) { return sum + Number(item.qty || 0); }, 0); };
  LL.cartSubtotal = function () {
    return LL.getCart().reduce(function (sum, item) {
      const p = D.byId(item.id);
      return sum + (p ? p.price * Number(item.qty || 0) : 0);
    }, 0);
  };

  LL.addToCart = function (id, qty, size, color) {
    const p = D.byId(id);
    if (!p) return;
    qty = Math.max(1, Number(qty || 1));
    size = size || p.sizes[0];
    color = color || p.colors[0].name;
    const cart = LL.getCart();
    const match = cart.find(function (item) { return item.id === id && item.size === size && item.color === color; });
    if (match) match.qty = Number(match.qty) + qty;
    else cart.push({ id: id, qty: qty, size: size, color: color });
    write(KEYS.cart, cart);
    LL.renderCart(true);
    LL.toast(p.name + ' added to your bag');
  };
  LL.updateCartQty = function (index, delta) {
    const cart = LL.getCart();
    if (!cart[index]) return;
    cart[index].qty = Number(cart[index].qty) + Number(delta);
    if (cart[index].qty <= 0) cart.splice(index, 1);
    write(KEYS.cart, cart);
    LL.renderCart(true);
  };
  LL.removeCartItem = function (index) {
    const cart = LL.getCart();
    if (!cart[index]) return;
    cart.splice(index, 1);
    write(KEYS.cart, cart);
    LL.renderCart(true);
  };
  LL.clearCart = function () { write(KEYS.cart, []); LL.renderCart(true); };
  LL.buyNow = function (id, qty, size, color) {
    LL.addToCart(id, qty, size, color);
    window.location.href = 'checkout.html';
  };
  LL.toggleWishlist = function (id) {
    const list = LL.getWishlist();
    const index = list.indexOf(id);
    if (index === -1) list.push(id); else list.splice(index, 1);
    write(KEYS.wishlist, list);
    LL.updateHeaderCounts();
    LL.refreshWishlistButtons();
    LL.renderWishlistProducts();
    document.dispatchEvent(new CustomEvent('ll:wishlist-updated', { detail: { id: id, active: index === -1 } }));
    LL.toast(index === -1 ? 'Saved to your wishlist' : 'Removed from your wishlist');
  };
  LL.clearWishlist = function () {
    write(KEYS.wishlist, []);
    LL.updateHeaderCounts();
    LL.refreshWishlistButtons();
    LL.renderWishlistProducts();
    LL.toast('Wishlist cleared');
  };
  LL.addRecent = function (id) {
    if (!D.byId(id)) return;
    let list = LL.getRecent().filter(function (item) { return item !== id; });
    list.unshift(id);
    list = list.slice(0, 8);
    write(KEYS.recent, list);
  };

  /* ---------------------------------------------------------------- shell */
  function active(page) { return document.body.dataset.page === page ? ' is-active' : ''; }
  function headerHTML() {
    return `
<div class="announcement" aria-label="Store announcements">
  <div class="announcement__track" aria-hidden="true">
    ${Array(4).fill('<span class="announcement__item"><i class="fa-solid fa-star"></i> Free UK delivery over £120 · Free 28-day returns <i class="fa-solid fa-star"></i> Woven with care in Shoreditch <i class="fa-solid fa-star"></i> Ships across the EU</span>').join('')}
    ${Array(4).fill('<span class="announcement__item"><i class="fa-solid fa-star"></i> Free UK delivery over £120 · Free 28-day returns <i class="fa-solid fa-star"></i> Woven with care in Shoreditch <i class="fa-solid fa-star"></i> Ships across the EU</span>').join('')}
  </div>
</div>
<header class="site-header">
  <div class="header-inner">
    <button class="icon-btn menu-toggle" type="button" data-open-mobile-nav aria-label="Open menu"><i class="ph ph-list"></i></button>
    <nav class="nav-split nav-left" aria-label="Shop navigation">
      <a class="nav-link${active('shop')}" href="shop.html">Shop All</a>
      <a class="nav-link" href="shop.html?sort=newest">New In</a>
      <a class="nav-link" href="category.html?c=unstitched-fabric">Fabric by the Metre</a>
    </nav>
    <a class="brand" href="index.html" aria-label="Linen &amp; Loom home"><img src="assets/logos/logo.svg" alt="LINEN &amp; LOOM" width="390" height="70"></a>
    <div class="header-right">
      <nav class="nav-split nav-right" aria-label="Editorial navigation">
        <a class="nav-link" href="category.html?c=occasion">Occasion</a>
        <a class="nav-link${active('lookbook')}" href="lookbook.html">Lookbook</a>
        <a class="nav-link${active('about')}" href="about.html">Our Craft</a>
        <a class="nav-link${active('blog')}" href="blog.html">Journal</a>
      </nav>
      <div class="header-tools">
        <button class="header-tool" type="button" data-open-search aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
        <a class="header-tool header-tool--account" href="track-order.html" aria-label="Track an order"><i class="fa-solid fa-user"></i></a>
        <a class="header-tool header-tool--wishlist" href="wishlist.html" aria-label="Wishlist"><i class="fa-regular fa-heart"></i><span class="header-tool__badge" data-wishlist-count>0</span></a>
        <button class="header-tool" type="button" data-open-cart aria-label="Open bag"><i class="fa-solid fa-bag-shopping"></i><span class="header-tool__badge" data-cart-count>0</span></button>
      </div>
    </div>
  </div>
</header>
<div class="search-overlay" id="searchOverlay" aria-hidden="true">
  <div class="search-panel">
    <div class="search-panel__top">
      <span class="eyebrow">Search the edit</span>
      <button class="icon-btn" type="button" data-close-search aria-label="Close search"><i class="ph ph-x"></i></button>
    </div>
    <label class="search-input-wrap" for="searchInput"><i class="fa-solid fa-magnifying-glass"></i><input id="searchInput" type="search" placeholder="Linen blazer, silk slip, UK 12…" autocomplete="off"><span class="visually-hidden">Search products</span></label>
    <p class="small-copy search-panel__hint">Try “blazer”, “occasion”, “linen” or a product name. Everything is searched locally.</p>
    <div class="search-results" id="searchResults" data-products="search"></div>
  </div>
</div>
<div class="mobile-nav-overlay" id="mobileNavOverlay" aria-hidden="true">
  <div class="mobile-nav-panel">
    <a class="brand" href="index.html"><img src="assets/logos/logo.svg" alt="LINEN &amp; LOOM"></a>
    <button class="icon-btn" type="button" data-close-mobile-nav aria-label="Close menu" style="float:right;margin-top:-58px"><i class="ph ph-x"></i></button>
    <nav aria-label="Mobile navigation">
      <a class="mobile-nav-link" href="shop.html">Shop All <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="shop.html?sort=newest">New In <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="category.html?c=unstitched-fabric">Fabric by the Metre <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="category.html?c=ready-to-wear">Ready-to-Wear <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="category.html?c=occasion">Occasion <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="category.html?c=accessories">Accessories <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="lookbook.html">Lookbook <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="about.html">Our Craft <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="blog.html">Journal <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="wishlist.html">Wishlist <i class="ph ph-arrow-up-right"></i></a>
      <a class="mobile-nav-link" href="contact.html">Contact <i class="ph ph-arrow-up-right"></i></a>
    </nav>
    <div class="mobile-nav-meta">
      <strong>Shoreditch atelier</strong><br>48 Redchurch St, London E2 7DP<br>
      <a href="tel:+442079460958">+44 20 7946 0958</a><br>Free UK delivery over £120
    </div>
  </div>
</div>`;
  }

  function footerHTML() {
    return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="assets/logos/logo-white.svg" alt="LINEN &amp; LOOM" width="390" height="70">
        <p>Premium womenswear, considered cloth and a working atelier in Shoreditch, London. Made in small runs, sent across the UK and EU.</p>
        <div class="footer-socials">
          <a href="#" data-toast="Follow @linenandloom on Instagram" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" data-toast="Find us on Facebook" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" data-toast="Our Pinterest boards are coming soon" aria-label="Pinterest"><i class="fa-brands fa-pinterest-p"></i></a>
          <a href="#" data-toast="Follow @linenandloom on TikTok" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <ul>
          <li><a href="shop.html">Shop All</a></li>
          <li><a href="shop.html?sort=newest">New In</a></li>
          <li><a href="category.html?c=unstitched-fabric">Fabric by the Metre</a></li>
          <li><a href="category.html?c=ready-to-wear">Ready-to-Wear</a></li>
          <li><a href="category.html?c=occasion">Occasion</a></li>
          <li><a href="category.html?c=accessories">Accessories</a></li>
          <li><a href="shop.html?sale=1">Boxing Day Sale</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Help</h4>
        <ul>
          <li><a href="size-guide.html">Size Guide</a></li>
          <li><a href="shipping-returns.html">Shipping &amp; Returns</a></li>
          <li><a href="track-order.html">Track Order</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="quick-view.html">Quick View</a></li>
          <li><a href="cart.html">Your Bag</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>About</h4>
        <ul>
          <li><a href="about.html">Our Craft</a></li>
          <li><a href="lookbook.html">Lookbook</a></li>
          <li><a href="blog.html">Journal</a></li>
          <li><a href="blog-single.html">Latest Story</a></li>
          <li><a href="404.html">Store Information</a></li>
        </ul>
        <p class="small-copy" style="margin-top:22px">48 Redchurch St<br>Shoreditch, London E2 7DP<br><a href="tel:+442079460958">+44 20 7946 0958</a></p>
      </div>
    </div>
    <div class="footer-payments">
      <div class="footer-payments__icons" aria-label="Accepted payment methods">
        <i class="fa-brands fa-cc-visa" title="Visa"></i>
        <i class="fa-brands fa-cc-mastercard" title="Mastercard"></i>
        <i class="fa-brands fa-cc-amex" title="American Express"></i>
        <i class="fa-brands fa-cc-paypal" title="PayPal"></i>
        <i class="fa-brands fa-apple-pay" title="Apple Pay"></i>
        <i class="fa-brands fa-google-pay" title="Google Pay"></i>
        <span class="klarna-badge">Klarna. 3 interest-free payments</span>
      </div>
      <span class="footer-payments__note"><i class="fa-solid fa-truck-fast"></i> Royal Mail · Free UK delivery over £120 · Ships EU · VAT included</span>
    </div>
    <div class="footer-bottom">
      <span>© 2026 LINEN &amp; LOOM Ltd. All prices include UK VAT. Fictional storefront for this design brief.</span>
      <span><a href="shipping-returns.html">Returns</a> · <a href="faq.html">Privacy</a> · <a href="#" data-cookie-preferences>Cookie preferences</a></span>
    </div>
  </div>
</footer>`;
  }

  function overlaysHTML() {
    return `
<div class="cart-backdrop" id="cartBackdrop"></div>
<aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Your bag" aria-hidden="true">
  <div class="cart-drawer__head">
    <div><span class="eyebrow">Your edit</span><h2>Shopping Bag</h2></div>
    <button class="cart-drawer__close" type="button" data-close-cart aria-label="Close bag"><i class="ph ph-x"></i></button>
  </div>
  <div class="cart-drawer__progress" id="cartProgress">Free UK delivery over £120<div class="cart-drawer__bar"><span id="cartProgressBar"></span></div></div>
  <div class="cart-lines" id="cartLines"></div>
  <div class="cart-drawer__foot">
    <div class="cart-subtotal"><span>Subtotal</span><span data-cart-subtotal>£0</span></div>
    <p class="cart-drawer__note">VAT included. Shipping calculated at checkout.</p>
    <a class="btn-editorial" href="checkout.html" data-checkout-button>Checkout <i class="fa-solid fa-lock"></i></a>
    <a class="cart-drawer__secondary" href="shop.html" data-close-cart>Continue shopping</a>
  </div>
</aside>

<div class="quick-view-backdrop" id="quickViewBackdrop"></div>
<div class="quick-view-modal" id="quickViewModal" role="dialog" aria-modal="true" aria-label="Quick view" aria-hidden="true">
  <div class="quick-view-dialog" id="quickViewDialog"></div>
</div>

<div class="modal fade size-chart-modal" id="sizeChartModal" tabindex="-1" aria-labelledby="sizeChartTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <div><span class="eyebrow">Find your fit</span><h2 class="modal-title" id="sizeChartTitle">UK / EU / US Size Guide</h2></div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <table class="table size-table"><thead><tr><th>UK</th><th>EU</th><th>US</th><th>Bust</th><th>Waist</th><th>Hip</th></tr></thead><tbody data-render="size-rows" data-cols="full"></tbody></table>
      </div>
      <div class="size-chart-note">Measurements are in centimetres. Our clothing is graded to UK sizes 6–18. If you are between sizes, our Shoreditch studio recommends sizing up for a relaxed fit. <a href="size-guide.html" class="text-link">Full size guide <i class="ph ph-arrow-up-right"></i></a></div>
    </div>
  </div>
</div>

<div class="cookie-panel" id="cookiePanel" role="region" aria-label="Cookie preferences">
  <h3>Cookies, considered</h3>
  <p>We use essential cookies to make the shop work, and optional cookies to understand what you love. You choose. Nothing is loaded from a third-party cookie service.</p>
  <div class="cookie-prefs">
    <div class="cookie-pref"><span><strong>Essential</strong><br>Cart, wishlist and consent</span><span>Always on</span></div>
    <label class="cookie-pref"><span><strong>Analytics</strong><br>Anonymous page insights</span><input type="checkbox" data-cookie-toggle="analytics"></label>
    <label class="cookie-pref"><span><strong>Marketing</strong><br>Relevant style notes</span><input type="checkbox" data-cookie-toggle="marketing"></label>
  </div>
  <div class="cookie-actions">
    <button class="btn-editorial btn-sm-editorial" type="button" data-cookie-accept>Accept all</button>
    <button class="btn-outline btn-sm-editorial" type="button" data-cookie-reject>Reject optional</button>
    <button class="btn-ghost btn-sm-editorial" type="button" data-cookie-toggle-panel>Preferences</button>
    <button class="btn-ghost btn-sm-editorial" type="button" data-cookie-save style="display:none">Save choices</button>
  </div>
</div>

<div class="toast-stack" id="toastStack" aria-live="polite" aria-atomic="true"></div>`;
  }

  /* ------------------------------------------------------------- renders */
  function productCardHTML(p) {
    const wish = LL.isWishlisted(p.id);
    const badgeClass = (p.badge === 'Sale' || p.badge === 'New In') ? '' : ' product-card__badge--quiet';
    const badge = p.badge ? '<span class="product-card__badge' + badgeClass + '">' + escapeHTML(p.badge) + '</span>' : '';
    return `
<article class="product-card" data-product-id="${p.id}">
  <div class="product-card__media">
    <a href="product.html?p=${p.id}" aria-label="${escapeHTML(p.name)}"><img class="product-card__image product-card__image--primary" src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy" decoding="async"></a>
    <img class="product-card__image product-card__image--secondary" src="${p.hover}" alt="Alternate view of ${escapeHTML(p.name)}" loading="lazy" decoding="async">
    ${badge}
    <div class="product-card__floating">
      <button type="button" data-wishlist="${p.id}" class="${wish ? 'is-active' : ''}" aria-label="${wish ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${wish}"><i class="${wish ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
      <button type="button" data-quick-view="${p.id}" aria-label="Quick view ${escapeHTML(p.name)}"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
    </div>
    <button class="product-card__add" type="button" data-add-to-cart="${p.id}"><i class="fa-solid fa-cart-plus"></i> Quick add</button>
  </div>
  <div class="product-card__info">
    <a class="product-card__category" href="category.html?c=${p.slug}">${escapeHTML(p.category)}</a>
    <h3 class="product-card__title"><a href="product.html?p=${p.id}">${escapeHTML(p.name)}</a></h3>
    ${priceHTML(p)}
    <div class="product-card__meta"><span class="product-card__rating"><i class="fa-solid fa-star"></i> ${p.rating.toFixed(1)} · ${p.reviewCount} reviews</span><span class="small-copy">${escapeHTML(p.occasion)}</span></div>
  </div>
</article>`;
  }
  LL.productCardHTML = productCardHTML;

  LL.renderProductCards = function (container, list, emptyMessage) {
    if (!container) return;
    if (!list || !list.length) {
      const isTrack = container.classList.contains('carousel-track');
      container.innerHTML = '<div class="no-results" style="' + (isTrack ? 'flex:0 0 100%;' : 'grid-column:1/-1;') + '">' + (emptyMessage || 'No pieces found.') + '</div>';
    } else {
      container.innerHTML = list.map(productCardHTML).join('');
    }
    LL.refreshWishlistButtons();
    LL.updateCarouselProgress();
    container.dispatchEvent(new CustomEvent('ll:products-rendered', { bubbles: true, detail: { count: list.length } }));
  };

  function currentProductId() {
    const params = new URLSearchParams(window.location.search);
    return document.body.dataset.productId || params.get('p') || '';
  }
  function productsForContainer(container) {
    const kind = container.dataset.products || 'all';
    const limit = Number(container.dataset.limit || 0);
    let list = D.products.slice();
    const category = container.dataset.category || new URLSearchParams(window.location.search).get('c');
    const occasion = container.dataset.occasion || new URLSearchParams(window.location.search).get('occasion');
    if (kind === 'new') list = list.filter(function (p) { return p.isNew; });
    else if (kind === 'bestsellers') list = list.filter(function (p) { return p.isBestseller; });
    else if (kind === 'sale') list = list.filter(function (p) { return p.sale; });
    else if (kind === 'shop' || kind === 'all') list = D.products.slice();
    else if (kind === 'category') list = category ? list.filter(function (p) { return p.slug === category; }) : list;
    else if (kind === 'occasion') list = occasion ? list.filter(function (p) { return occasionSlug(p.occasion) === occasion; }) : list;
    else if (kind === 'wishlist') list = LL.getWishlist().map(D.byId).filter(Boolean);
    else if (kind === 'recent') list = LL.getRecent().map(D.byId).filter(Boolean);
    else if (kind === 'search') list = list.slice(0, 4);
    else if (kind === 'related' || kind === 'complete') {
      const current = D.byId(currentProductId());
      if (current) {
        if (kind === 'complete') list = (current.pairWith || []).map(D.byId).filter(Boolean);
        else list = list.filter(function (p) { return p.id !== current.id && p.slug === current.slug; });
      }
    }
    const exclude = container.dataset.excludeId;
    if (exclude) list = list.filter(function (p) { return p.id !== exclude; });
    if (container.dataset.sort) list = sortProducts(list, container.dataset.sort);
    if (limit) list = list.slice(0, limit);
    return list;
  }
  LL.renderProducts = function () {
    document.querySelectorAll('[data-products]').forEach(function (container) {
      if (container.id === 'searchResults') return;
      const list = productsForContainer(container);
      LL.renderProductCards(container, list, container.dataset.empty || 'No pieces found for this edit.');
    });
  };
  LL.renderWishlistProducts = function () {
    document.querySelectorAll('[data-products="wishlist"]').forEach(function (container) {
      LL.renderProductCards(container, LL.getWishlist().map(D.byId).filter(Boolean), 'Your wishlist is waiting. Tap the heart on any piece to save it here.');
    });
  };

  function categoryCardHTML(c) {
    return `
<a class="category-card" href="category.html?c=${c.slug}">
  <img class="category-card__main" src="${c.image}" alt="${escapeHTML(c.title)}" loading="lazy" decoding="async">
  <img class="category-card__hover" src="${c.hover}" alt="" aria-hidden="true" loading="lazy" decoding="async">
  <div class="category-card__content">
    <i class="category-card__icon ${c.icon}" aria-hidden="true"></i>
    <h3 class="category-card__title">${escapeHTML(c.tile)}</h3>
    <span class="category-card__sub">Explore <i class="ph ph-arrow-right"></i></span>
  </div>
</a>`;
  }
  function occasionCardHTML(o) {
    return `
<a class="occasion-card" href="shop.html?occasion=${o.slug}">
  <img src="${o.image}" alt="${escapeHTML(o.title)}" loading="lazy" decoding="async">
  <div class="occasion-card__content"><i class="occasion-card__icon ${o.icon}" aria-hidden="true"></i><h3 class="occasion-card__title">${escapeHTML(o.title)}</h3></div>
</a>`;
  }
  function swatchHTML(s) {
    return `<div class="swatch" tabindex="0" aria-label="${escapeHTML(s.name)}"><img src="${s.image}" alt="${escapeHTML(s.name)}" loading="lazy" decoding="async"><span class="swatch__name"><i class="swatch__dot" style="background:${s.hex}"></i>${escapeHTML(s.name)}</span></div>`;
  }
  function reviewCardHTML(r) {
    return `
<article class="review-card">
  <div class="review-card__stars stars" aria-label="${r.rating} out of 5">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
  <h3>${escapeHTML(r.title)}</h3>
  <p>“${escapeHTML(r.text)}”</p>
  <div class="review-card__meta"><span>${escapeHTML(r.name)} · ${escapeHTML(r.location)}</span><span>${escapeHTML(r.date)}</span></div>
</article>`;
  }
  function blogCardHTML(post) {
    return `
<article class="blog-card">
  <a class="blog-card__media" href="blog-single.html?post=${post.slug}"><img src="${post.image}" alt="${escapeHTML(post.title)}" loading="lazy" decoding="async"></a>
  <div class="blog-card__body">
    <span class="blog-card__meta">${escapeHTML(post.category)} · ${escapeHTML(post.date)} · ${escapeHTML(post.readTime)}</span>
    <h3><a href="blog-single.html?post=${post.slug}">${escapeHTML(post.title)}</a></h3>
    <p>${escapeHTML(post.excerpt)}</p>
    <a class="text-link" href="blog-single.html?post=${post.slug}">Read story <i class="ph ph-arrow-up-right"></i></a>
  </div>
</article>`;
  }
  function lookbookSlideHTML(item, i) {
    return `
<article class="lookbook-slide">
  <img src="${item.image}" alt="${escapeHTML(item.note)}" loading="lazy" decoding="async">
  <span class="lookbook-slide__index">${escapeHTML(item.title)} / Winter 2026</span>
  <div class="lookbook-slide__caption"><div><h3>${escapeHTML(item.title)}</h3><span>${escapeHTML(item.note)}</span></div><button class="lookbook-slide__shop" type="button" data-quick-view="${item.product}">Shop this look</button></div>
</article>`;
  }
  function lookbookPageCardHTML(item, i) {
    return `
<a class="lookbook-page-card" href="product.html?p=${item.product}">
  <img src="${item.image}" alt="${escapeHTML(item.note)}" loading="lazy" decoding="async">
  <span class="lookbook-page-card__caption">${escapeHTML(item.title)} · ${escapeHTML(item.note)}</span>
</a>`;
  }
  function sizeRowsHTML(container) {
    const full = container.dataset.cols === 'full';
    const limit = Number(container.dataset.limit || D.sizeRows.length);
    return D.sizeRows.slice(0, limit).map(function (r) {
      return '<tr><td>UK ' + r.uk + '</td><td>' + r.eu + '</td><td>' + r.us + '</td>' +
        (full ? '<td>' + r.bust + ' cm</td><td>' + r.waist + ' cm</td><td>' + r.hip + ' cm</td>' : '') + '</tr>';
    }).join('');
  }
  function renderRecentlyViewed() {
    const current = currentProductId();
    const ids = LL.getRecent().filter(function (id) { return id !== current; }).slice(0, 6);
    document.querySelectorAll('[data-render="recently-viewed"]').forEach(function (container) {
      if (!ids.length) { container.innerHTML = '<p class="small-copy">Recently viewed pieces will appear here.</p>'; return; }
      container.innerHTML = ids.map(function (id) {
        const p = D.byId(id);
        return '<a class="recently-viewed-card" href="product.html?p=' + p.id + '"><img src="' + p.image + '" alt="' + escapeHTML(p.name) + '" loading="lazy"><h4>' + escapeHTML(p.name) + '</h4><span class="small-copy">' + money(p.price) + '</span></a>';
      }).join('');
    });
  }
  LL.renderRecentlyViewed = renderRecentlyViewed;

  const ugc = [
    { image: 'assets/images/ugc-01.jpg', handle: '@amelia.r' },
    { image: 'assets/images/ugc-02.jpg', handle: '@thequietedit' },
    { image: 'assets/images/ugc-03.jpg', handle: '@sophie.m' },
    { image: 'assets/images/ugc-04.jpg', handle: '@studio.ninety' },
    { image: 'assets/images/ugc-05.jpg', handle: '@priya.k' },
    { image: 'assets/images/ugc-06.jpg', handle: '@linenandloom' }
  ];
  const insta = [
    { image: 'assets/images/instagram-01.jpg', product: 'harrow-linen-blazer' },
    { image: 'assets/images/instagram-02.jpg', product: 'belgian-linen-oat' },
    { image: 'assets/images/instagram-03.jpg', product: 'etta-tailored-suit' },
    { image: 'assets/images/instagram-04.jpg', product: 'muse-silk-scarf' },
    { image: 'assets/images/instagram-05.jpg', product: 'isla-sheer-column-dress' },
    { image: 'assets/images/instagram-06.jpg', product: 'rivington-leather-tote' }
  ];
  function renderStaticContent() {
    document.querySelectorAll('[data-render]').forEach(function (el) {
      const kind = el.dataset.render;
      if (kind === 'categories') el.innerHTML = D.categories.map(categoryCardHTML).join('');
      else if (kind === 'occasions') el.innerHTML = D.occasions.map(occasionCardHTML).join('');
      else if (kind === 'swatches') el.innerHTML = D.swatches.map(swatchHTML).join('');
      else if (kind === 'reviews') el.innerHTML = D.reviews.map(reviewCardHTML).join('');
      else if (kind === 'blog-home') el.innerHTML = D.blogPosts.slice(0, 3).map(blogCardHTML).join('');
      else if (kind === 'blog-all') el.innerHTML = D.blogPosts.map(blogCardHTML).join('');
      else if (kind === 'related-posts') el.innerHTML = D.blogPosts.slice(1, 4).map(blogCardHTML).join('');
      else if (kind === 'lookbook') el.innerHTML = D.lookbook.map(lookbookSlideHTML).join('');
      else if (kind === 'lookbook-page') el.innerHTML = D.lookbook.map(lookbookPageCardHTML).join('');
      else if (kind === 'size-rows') el.innerHTML = sizeRowsHTML(el);
      else if (kind === 'recently-viewed') renderRecentlyViewed();
      else if (kind === 'ugc') el.innerHTML = ugc.map(function (u) {
        return '<a class="ugc-tile" href="shop.html" aria-label="Customer photo ' + escapeHTML(u.handle) + '"><img src="' + u.image + '" alt="Worn by ' + escapeHTML(u.handle) + '" loading="lazy"><span class="ugc-tile__overlay"><i class="fa-brands fa-instagram"></i> &nbsp;' + escapeHTML(u.handle) + '</span></a>';
      }).join('');
      else if (kind === 'instagram') el.innerHTML = insta.map(function (u, i) {
        return '<div class="instagram-tile"><img src="' + u.image + '" alt="Shoppable Instagram look ' + (i + 1) + '" loading="lazy"><span class="instagram-tile__overlay">Shop the feed</span><button class="instagram-hotspot" type="button" data-quick-view="' + u.product + '" aria-label="Quick view look ' + (i + 1) + '"><i class="ph ph-plus"></i></button></div>';
      }).join('');
    });
  }

  /* -------------------------------------------------------- cart render */
  function cartLineHTML(item, index) {
    const p = D.byId(item.id);
    return `
<div class="cart-line">
  <a href="product.html?p=${p.id}"><img src="${p.image}" alt="${escapeHTML(p.name)}"></a>
  <div class="cart-line__body">
    <div class="cart-line__title"><a href="product.html?p=${p.id}">${escapeHTML(p.name)}</a></div>
    <div class="cart-line__variant">${escapeHTML(item.size)} · ${escapeHTML(item.color)}</div>
    <div class="cart-line__bottom">
      <div class="qty-stepper">
        <button type="button" data-cart-update="${index}" data-delta="-1" aria-label="Decrease quantity"><i class="ph ph-minus"></i></button>
        <span>${Number(item.qty)}</span>
        <button type="button" data-cart-update="${index}" data-delta="1" aria-label="Increase quantity"><i class="ph ph-plus"></i></button>
      </div>
      <span class="price">${money(p.price * Number(item.qty))}</span>
    </div>
    <button class="cart-line__remove" type="button" data-cart-remove="${index}" style="margin-top:10px">Remove</button>
  </div>
</div>`;
  }
  LL.renderCart = function (emit) {
    const cart = LL.getCart();
    const subtotal = LL.cartSubtotal();
    const lines = document.getElementById('cartLines');
    if (lines) {
      lines.innerHTML = cart.length ? cart.map(cartLineHTML).join('') :
        '<div class="cart-empty"><i class="fa-solid fa-bag-shopping"></i><h3>Your bag is empty</h3><p>Consider something beautifully made.</p><a class="btn-outline btn-sm-editorial" href="shop.html">Shop the edit</a></div>';
    }
    const subtotalEls = document.querySelectorAll('[data-cart-subtotal]');
    subtotalEls.forEach(function (el) { el.textContent = money(subtotal); });
    const countEls = document.querySelectorAll('[data-cart-count-text]');
    countEls.forEach(function (el) { el.textContent = LL.cartCount() + (LL.cartCount() === 1 ? ' item' : ' items'); });
    const progress = document.getElementById('cartProgress');
    const bar = document.getElementById('cartProgressBar');
    if (progress && bar) {
      const remaining = Math.max(0, 120 - subtotal);
      progress.firstChild.textContent = remaining > 0 ? 'You are ' + money(remaining) + ' away from free UK delivery' : 'You have unlocked free UK delivery';
      bar.style.width = Math.min(100, subtotal / 120 * 100) + '%';
    }
    document.querySelectorAll('[data-cart-table]').forEach(function (el) {
      if (!cart.length) { el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bag-shopping"></i><h3>Your bag is empty</h3><p>Use the drawer or explore the shop to add a piece.</p></div>'; return; }
      el.innerHTML = '<div class="table-responsive"><table class="table info-table"><thead><tr><th>Piece</th><th>Options</th><th>Qty</th><th>Price</th></tr></thead><tbody>' +
        cart.map(function (item) { const p = D.byId(item.id); return '<tr><td><a href="product.html?p=' + p.id + '">' + escapeHTML(p.name) + '</a></td><td>' + escapeHTML(item.size) + ' · ' + escapeHTML(item.color) + '</td><td>' + item.qty + '</td><td>' + money(p.price * item.qty) + '</td></tr>'; }).join('') +
        '</tbody></table></div>';
    });
    LL.updateHeaderCounts();
    LL.refreshWishlistButtons();
    if (emit) document.dispatchEvent(new CustomEvent('ll:cart-updated', { detail: { count: LL.cartCount(), subtotal: subtotal } }));
  };
  LL.updateHeaderCounts = function () {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = LL.cartCount();
      el.classList.toggle('is-empty', LL.cartCount() === 0);
    });
    document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
      el.textContent = LL.getWishlist().length;
      el.classList.toggle('is-empty', LL.getWishlist().length === 0);
    });
  };
  LL.refreshWishlistButtons = function () {
    document.querySelectorAll('[data-wishlist]').forEach(function (btn) {
      const active = LL.isWishlisted(btn.dataset.wishlist);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
      const icon = btn.querySelector('i');
      if (icon) { icon.classList.toggle('fa-solid', active); icon.classList.toggle('fa-regular', !active); }
      const text = btn.querySelector('[data-wishlist-text]');
      if (text) text.textContent = active ? 'Saved to wishlist' : 'Add to wishlist';
    });
  };

  /* ------------------------------------------------------------- search */
  function renderSearchResults(query) {
    const el = document.getElementById('searchResults');
    if (!el) return;
    const q = String(query || '').trim().toLowerCase();
    let list = D.products;
    if (q) {
      list = list.filter(function (p) {
        const hay = [p.name, p.category, p.occasion, p.description, p.fabric].join(' ').toLowerCase();
        return hay.indexOf(q) !== -1 || p.sizes.some(function (s) { return 'uk ' + s.toLowerCase() === q || s.toLowerCase() === q; });
      });
    }
    LL.renderProductCards(el, list.slice(0, 4), 'No pieces found. Try “linen”, “silk” or “blazer”.');
  }
  LL.renderSearchResults = renderSearchResults;

  /* -------------------------------------------------------- quick view */
  function optionButtons(values, type) {
    return values.map(function (value, i) {
      if (type === 'size') return '<button class="size-option' + (i === 0 ? ' is-active' : '') + '" type="button" data-size="' + escapeHTML(value) + '" aria-pressed="' + (i === 0) + '">' + escapeHTML(value) + '</button>';
      return '<button class="color-option' + (i === 0 ? ' is-active' : '') + '" type="button" data-color="' + escapeHTML(value.name) + '" aria-label="' + escapeHTML(value.name) + '" aria-pressed="' + (i === 0) + '"><span style="background:' + value.hex + '"></span></button>';
    }).join('');
  }
  function quickViewHTML(p) {
    return `
<button class="quick-view-close" type="button" data-close-quick-view aria-label="Close quick view"><i class="ph ph-x"></i></button>
<div class="quick-view-media"><img src="${p.image}" alt="${escapeHTML(p.name)}"></div>
<div class="quick-view-body" data-option-scope="quick-view" data-product-id="${p.id}">
  <span class="eyebrow">${escapeHTML(p.category)} · ${escapeHTML(p.occasion)}</span>
  <h2>${escapeHTML(p.name)}</h2>
  <div class="pdp-rating"><span class="stars">★★★★★</span> <span>${p.rating.toFixed(1)} · ${p.reviewCount} reviews</span></div>
  ${priceHTML(p, 'price--accent')}
  <p>${escapeHTML(p.description)}</p>
  <div class="quick-view-options">
    <div class="quick-view-options__label"><span>Colour · <span data-color-name>${escapeHTML(p.colors[0].name)}</span></span><span>${p.colors.length} tones</span></div>
    <div class="color-options">${optionButtons(p.colors, 'color')}</div>
  </div>
  <div class="quick-view-options">
    <div class="quick-view-options__label"><span>UK size · <span data-size-label>${escapeHTML(p.sizes[0])}</span></span><button type="button" data-open-size-chart><i class="fa-solid fa-ruler"></i> Size guide</button></div>
    <div class="size-options">${optionButtons(p.sizes, 'size')}</div>
  </div>
  <div class="quick-view-actions">
    <div class="qty-stepper" data-qty-stepper>
      <button type="button" data-qty-minus aria-label="Decrease quantity"><i class="ph ph-minus"></i></button>
      <span data-qty-value>1</span>
      <button type="button" data-qty-plus aria-label="Increase quantity"><i class="ph ph-plus"></i></button>
    </div>
    <button class="btn-editorial" type="button" data-add-to-cart="${p.id}">Add to bag <i class="fa-solid fa-cart-plus"></i></button>
  </div>
  <div class="quick-view-footer">
    <a class="text-link" href="product.html?p=${p.id}">Full details <i class="ph ph-arrow-up-right"></i></a>
    <button class="icon-btn" type="button" data-wishlist="${p.id}" aria-label="Add to wishlist"><i class="fa-regular fa-heart"></i></button>
  </div>
  <p class="small-copy" style="margin-top:16px"><i class="fa-solid fa-truck-fast"></i> Free UK delivery over £120 · Free 28-day UK returns</p>
</div>`;
  }
  LL.syncAddButton = function (scope) {
    if (!scope) return;
    const add = scope.querySelector('[data-add-to-cart]');
    if (!add) return;
    const p = D.byId(scope.dataset.productId || add.dataset.addToCart);
    if (!p) return;
    const sizeBtn = scope.querySelector('.size-option.is-active');
    const colorBtn = scope.querySelector('.color-option.is-active');
    const qtyEl = scope.querySelector('[data-qty-value]');
    const size = (sizeBtn && sizeBtn.dataset.size) || p.sizes[0];
    const color = (colorBtn && colorBtn.dataset.color) || p.colors[0].name;
    const qty = Math.max(1, Number((qtyEl && qtyEl.textContent) || 1));
    add.dataset.size = size;
    add.dataset.color = color;
    add.dataset.qty = qty;
    const cname = scope.querySelector('[data-color-name]');
    const sname = scope.querySelector('[data-size-label]');
    if (cname) cname.textContent = color;
    if (sname) sname.textContent = size;
  };

  LL.openQuickView = function (id) {
    const p = D.byId(id);
    if (!p) return;
    LL.closeCart(true); LL.closeSearch(); LL.closeMobileNav();
    const modal = document.getElementById('quickViewModal');
    const backdrop = document.getElementById('quickViewBackdrop');
    const dialog = document.getElementById('quickViewDialog');
    if (!modal || !dialog) return;
    dialog.innerHTML = quickViewHTML(p);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('is-open');
    LL.syncAddButton(dialog.querySelector('[data-option-scope]'));
    LL.refreshWishlistButtons();
    if (motionOK) {
      window.gsap.killTweensOf([dialog, backdrop]);
      window.gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .28, ease: 'power2.out' });
      window.gsap.fromTo(dialog, { opacity: 0, scale: .96, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: .5, ease: 'power3.out' });
    } else {
      dialog.style.opacity = 1; dialog.style.transform = 'none'; backdrop.style.opacity = 1;
    }
    updateBodyLock();
  };
  LL.closeQuickView = function (instant) {
    const modal = document.getElementById('quickViewModal');
    const backdrop = document.getElementById('quickViewBackdrop');
    const dialog = document.getElementById('quickViewDialog');
    if (!modal || !modal.classList.contains('is-open')) return;
    const finish = function () {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      backdrop.classList.remove('is-open');
      updateBodyLock();
    };
    if (instant || !motionOK) {
      window.gsap && window.gsap.killTweensOf([dialog, backdrop]);
      if (dialog) { dialog.style.opacity = 0; dialog.style.transform = 'scale(.96)'; }
      if (backdrop) backdrop.style.opacity = 0;
      finish();
    } else {
      window.gsap.killTweensOf([dialog, backdrop]);
      window.gsap.to(dialog, { opacity: 0, scale: .96, y: 12, duration: .24, ease: 'power2.in' });
      window.gsap.to(backdrop, { opacity: 0, duration: .24, onComplete: finish });
    }
  };

  /* -------------------------------------------------------------- cart */
  LL.openCart = function () {
    LL.closeQuickView(true); LL.closeSearch(); LL.closeMobileNav();
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if (!drawer || !backdrop) return;
    LL.renderCart(false);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('is-open');
    if (motionOK) {
      window.gsap.killTweensOf([drawer, backdrop]);
      window.gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .28, ease: 'power2.out' });
      window.gsap.fromTo(drawer, { xPercent: 100 }, { xPercent: 0, duration: .55, ease: 'power3.out' });
      window.gsap.fromTo(drawer.querySelectorAll('.cart-line'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .32, delay: .18, ease: 'power2.out' });
    } else {
      drawer.style.transform = 'translateX(0)';
      backdrop.style.opacity = 1;
    }
    updateBodyLock();
  };
  LL.closeCart = function (instant) {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if (!drawer || !drawer.classList.contains('is-open')) return;
    const finish = function () {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      backdrop.classList.remove('is-open');
      updateBodyLock();
    };
    if (instant || !motionOK) {
      window.gsap && window.gsap.killTweensOf([drawer, backdrop]);
      drawer.style.transform = 'translateX(100%)';
      backdrop.style.opacity = 0;
      finish();
    } else {
      window.gsap.killTweensOf([drawer, backdrop]);
      window.gsap.to(drawer, { xPercent: 100, duration: .4, ease: 'power2.in' });
      window.gsap.to(backdrop, { opacity: 0, duration: .3, onComplete: finish });
    }
  };

  /* --------------------------------------------------- search/nav/cookie */
  LL.openSearch = function () {
    LL.closeCart(true); LL.closeQuickView(true); LL.closeMobileNav();
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    renderSearchResults('');
    const input = document.getElementById('searchInput');
    if (input) window.setTimeout(function () { input.focus(); }, 80);
    updateBodyLock();
  };
  LL.closeSearch = function () {
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true');
    updateBodyLock();
  };
  LL.openMobileNav = function () {
    LL.closeCart(true); LL.closeQuickView(true); LL.closeSearch();
    const overlay = document.getElementById('mobileNavOverlay');
    if (!overlay) return;
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    updateBodyLock();
  };
  LL.closeMobileNav = function () {
    const overlay = document.getElementById('mobileNavOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true');
    updateBodyLock();
  };
  LL.openSizeChart = function () {
    const el = document.getElementById('sizeChartModal');
    if (!el || !window.bootstrap || !window.bootstrap.Modal) { LL.toast('Size guide is available on the Size Guide page'); return; }
    window.bootstrap.Modal.getOrCreateInstance(el).show();
  };
  function updateBodyLock() {
    const open = document.querySelector('.cart-drawer.is-open, .quick-view-modal.is-open, .search-overlay.is-open, .mobile-nav-overlay.is-open');
    document.body.classList.toggle('is-locked', Boolean(open));
  }
  LL.updateBodyLock = updateBodyLock;

  function showCookie(showPrefs) {
    const panel = document.getElementById('cookiePanel');
    if (!panel) return;
    panel.classList.add('is-open');
    panel.classList.toggle('is-prefs', Boolean(showPrefs));
    const save = panel.querySelector('[data-cookie-save]');
    const toggle = panel.querySelector('[data-cookie-toggle-panel]');
    if (save) save.style.display = showPrefs ? 'inline-flex' : 'none';
    if (toggle) toggle.style.display = showPrefs ? 'none' : 'inline-flex';
    const consent = LL.getConsent();
    if (consent) {
      panel.querySelector('[data-cookie-toggle="analytics"]').checked = Boolean(consent.analytics);
      panel.querySelector('[data-cookie-toggle="marketing"]').checked = Boolean(consent.marketing);
    }
  }
  function hideCookie() { const panel = document.getElementById('cookiePanel'); if (panel) panel.classList.remove('is-open', 'is-prefs'); }
  function saveConsent(values) {
    const consent = { necessary: true, analytics: Boolean(values.analytics), marketing: Boolean(values.marketing), savedAt: new Date().toISOString() };
    write(KEYS.consent, consent);
    hideCookie();
    LL.toast('Cookie preferences saved');
  }
  LL.showCookie = showCookie;

  /* -------------------------------------------------------------- toast */
  LL.toast = function (message) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'll-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<i class="fa-solid fa-check" style="margin-right:10px;color:var(--clr-secondary)"></i>' + escapeHTML(message);
    stack.appendChild(el);
    window.requestAnimationFrame(function () { el.classList.add('is-visible'); });
    window.setTimeout(function () {
      el.classList.remove('is-visible');
      window.setTimeout(function () { el.remove(); }, 350);
    }, 3200);
  };

  /* ------------------------------------------------------------ events */
  function onClick(e) {
    const target = e.target instanceof Element ? e.target : e.target.parentElement;
    if (!target) return;
    const el = function (sel) { return target.closest(sel); };

    if (el('[data-open-cart]')) { e.preventDefault(); LL.openCart(); return; }
    const closeCartEl = el('[data-close-cart]');
    if (closeCartEl || (target.id === 'cartBackdrop')) {
      const isNavigatingLink = closeCartEl && closeCartEl.tagName === 'A' && closeCartEl.getAttribute('href') && closeCartEl.getAttribute('href') !== '#';
      if (!isNavigatingLink) e.preventDefault();
      LL.closeCart();
      return;
    }
    if (el('[data-open-quick-view]')) { e.preventDefault(); LL.openQuickView(el('[data-open-quick-view]').dataset.openQuickView); return; }
    if (el('[data-quick-view]')) { e.preventDefault(); LL.openQuickView(el('[data-quick-view]').dataset.quickView); return; }
    if (el('[data-close-quick-view]') || (target.id === 'quickViewBackdrop')) { e.preventDefault(); LL.closeQuickView(); return; }
    if (el('[data-open-search]')) { e.preventDefault(); LL.openSearch(); return; }
    if (el('[data-close-search]') || (target.id === 'searchOverlay')) { e.preventDefault(); LL.closeSearch(); return; }
    if (el('[data-open-mobile-nav]')) { e.preventDefault(); LL.openMobileNav(); return; }
    if (el('[data-close-mobile-nav]') || (target.id === 'mobileNavOverlay')) { e.preventDefault(); LL.closeMobileNav(); return; }
    if (el('[data-open-size-chart]')) { e.preventDefault(); LL.openSizeChart(); return; }
    if (el('[data-cookie-preferences]')) { e.preventDefault(); showCookie(true); return; }
    if (el('[data-cookie-toggle-panel]')) { e.preventDefault(); showCookie(true); return; }
    if (el('[data-cookie-accept]')) { e.preventDefault(); saveConsent({ analytics: true, marketing: true }); return; }
    if (el('[data-cookie-reject]')) { e.preventDefault(); saveConsent({ analytics: false, marketing: false }); return; }
    if (el('[data-cookie-save]')) {
      e.preventDefault();
      const panel = document.getElementById('cookiePanel');
      saveConsent({ analytics: panel.querySelector('[data-cookie-toggle="analytics"]').checked, marketing: panel.querySelector('[data-cookie-toggle="marketing"]').checked });
      return;
    }

    const cartUpdate = el('[data-cart-update]');
    if (cartUpdate) { e.preventDefault(); LL.updateCartQty(Number(cartUpdate.dataset.cartUpdate), Number(cartUpdate.dataset.delta)); return; }
    const cartRemove = el('[data-cart-remove]');
    if (cartRemove) { e.preventDefault(); LL.removeCartItem(Number(cartRemove.dataset.cartRemove)); return; }
    if (el('[data-cart-clear]')) { e.preventDefault(); LL.clearCart(); return; }
    const checkoutBtn = el('[data-checkout-button]');
    if (checkoutBtn && !LL.getCart().length) { e.preventDefault(); LL.toast('Your bag is empty — add a piece first'); return; }

    const qtyBtn = el('[data-qty-minus], [data-qty-plus]');
    if (qtyBtn && !qtyBtn.closest('.cart-line')) {
      e.preventDefault();
      const stepper = qtyBtn.closest('[data-qty-stepper]');
      const value = stepper && stepper.querySelector('[data-qty-value]');
      if (value) {
        let n = Number(value.textContent || 1);
        n = qtyBtn.hasAttribute('data-qty-plus') ? n + 1 : Math.max(1, n - 1);
        value.textContent = n;
        const scope = qtyBtn.closest('[data-option-scope]');
        LL.syncAddButton(scope);
      }
      return;
    }
    const sizeOption = el('.size-option');
    if (sizeOption) {
      e.preventDefault();
      const scope = sizeOption.closest('[data-option-scope]') || sizeOption.parentElement;
      scope.querySelectorAll('.size-option').forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
      sizeOption.classList.add('is-active'); sizeOption.setAttribute('aria-pressed', 'true');
      LL.syncAddButton(sizeOption.closest('[data-option-scope]'));
      return;
    }
    const colorOption = el('.color-option');
    if (colorOption) {
      e.preventDefault();
      const scope = colorOption.closest('[data-option-scope]') || colorOption.parentElement;
      scope.querySelectorAll('.color-option').forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
      colorOption.classList.add('is-active'); colorOption.setAttribute('aria-pressed', 'true');
      LL.syncAddButton(colorOption.closest('[data-option-scope]'));
      return;
    }

    const wishBtn = el('[data-wishlist]');
    if (wishBtn) { e.preventDefault(); LL.toggleWishlist(wishBtn.dataset.wishlist); return; }
    if (el('[data-clear-wishlist]')) { e.preventDefault(); LL.clearWishlist(); return; }
    if (el('[data-move-all-to-bag]')) {
      e.preventDefault();
      const ids = LL.getWishlist();
      if (!ids.length) { LL.toast('Your wishlist is empty'); return; }
      ids.forEach(function (id) { const p = D.byId(id); LL.addToCart(id, 1, p.sizes[0], p.colors[0].name); });
      LL.openCart();
      return;
    }
    if (el('[data-share-wishlist]')) {
      e.preventDefault();
      const url = window.location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { LL.toast('Wishlist link copied'); }).catch(function () { LL.toast('Copy this page URL to share: ' + url); });
      else LL.toast('Copy this page URL to share your wishlist');
      return;
    }
    const addBtn = el('[data-add-to-cart]');
    if (addBtn) {
      e.preventDefault();
      const id = addBtn.dataset.addToCart;
      const p = D.byId(id);
      if (!p) return;
      const scope = addBtn.closest('[data-option-scope]');
      LL.syncAddButton(scope);
      const size = addBtn.dataset.size || p.sizes[0];
      const color = addBtn.dataset.color || p.colors[0].name;
      const qty = Number(addBtn.dataset.qty || 1);
      LL.addToCart(id, qty, size, color);
      if (addBtn.dataset.openCart !== 'false') LL.openCart();
      return;
    }
    if (el('[data-open-cart-after-add]')) { e.preventDefault(); LL.openCart(); return; }
    const toastEl = el('[data-toast]');
    if (toastEl) {
      if (toastEl.tagName === 'A') e.preventDefault();
      LL.toast(toastEl.dataset.toast);
      return;
    }
    const searchLink = el('#searchOverlay a[href]');
    if (searchLink) LL.closeSearch();
    const mobileLink = el('#mobileNavOverlay a[href]');
    if (mobileLink) LL.closeMobileNav();
  }

  function onInput(e) {
    if (e.target && e.target.id === 'searchInput') renderSearchResults(e.target.value);
  }
  function onSubmit(e) {
    const form = e.target;
    if (!form || !form.matches) return;
    if (form.matches('[data-newsletter]')) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.checkValidity()) { LL.toast('Please enter a valid email address'); return; }
      write(KEYS.newsletter, { email: input.value, savedAt: new Date().toISOString() });
      LL.toast('Welcome — your 10% code is LINEN10');
      form.reset();
    }
  }
  function onKeydown(e) {
    if (e.key === 'Escape') { LL.closeCart(); LL.closeQuickView(); LL.closeSearch(); LL.closeMobileNav(); }
  }

  /* ------------------------------------------------------------ motion */
  LL.initCarousels = function () {
    document.querySelectorAll('.carousel').forEach(function (carousel) {
      if (carousel.dataset.carouselReady) return;
      carousel.dataset.carouselReady = 'true';
      const viewport = carousel.querySelector('.carousel-viewport');
      const prev = carousel.querySelector('[data-carousel-prev]');
      const next = carousel.querySelector('[data-carousel-next]');
      if (!viewport) return;
      const step = function () { return Math.max(260, viewport.clientWidth * .78); };
      if (prev) prev.addEventListener('click', function () { viewport.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      if (next) next.addEventListener('click', function () { viewport.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      viewport.addEventListener('scroll', function () { LL.updateCarouselProgress(carousel); }, { passive: true });
      let draggableOK = false;
      if (motionOK && hasDraggable) {
        try {
          window.Draggable.create(viewport, {
            type: 'scrollLeft',
            edgeResistance: .7,
            dragResistance: .04,
            allowNativeTouchScrolling: true,
            cursor: 'grab',
            activeCursor: 'grabbing',
            onDragStart: function () { viewport.classList.add('is-dragging'); },
            onDragEnd: function () { viewport.classList.remove('is-dragging'); LL.updateCarouselProgress(carousel); },
            onDrag: function () { LL.updateCarouselProgress(carousel); }
          });
          draggableOK = true;
        } catch (err) { draggableOK = false; }
      }
      if (!draggableOK) {
        let down = false, startX = 0, startScroll = 0;
        viewport.addEventListener('pointerdown', function (ev) {
          if (ev.pointerType !== 'mouse' || ev.target.closest('button,a')) return;
          down = true; startX = ev.clientX; startScroll = viewport.scrollLeft;
          viewport.classList.add('is-dragging');
          viewport.setPointerCapture(ev.pointerId);
        });
        viewport.addEventListener('pointermove', function (ev) {
          if (!down) return;
          viewport.scrollLeft = startScroll - (ev.clientX - startX);
          LL.updateCarouselProgress(carousel);
        });
        const end = function () { down = false; viewport.classList.remove('is-dragging'); };
        viewport.addEventListener('pointerup', end);
        viewport.addEventListener('pointercancel', end);
      }
      LL.updateCarouselProgress(carousel);
    });
  };
  LL.updateCarouselProgress = function (only) {
    const list = only ? [only] : document.querySelectorAll('.carousel');
    list.forEach(function (carousel) {
      const viewport = carousel.querySelector('.carousel-viewport');
      const track = carousel.querySelector('.carousel-track');
      const bar = carousel.querySelector('.carousel-progress span');
      if (!viewport || !track || !bar) return;
      const max = Math.max(1, track.scrollWidth - viewport.clientWidth);
      const ratio = Math.min(1, viewport.clientWidth / Math.max(1, track.scrollWidth));
      const width = Math.max(8, ratio * 100);
      bar.style.width = width + '%';
      bar.style.left = (viewport.scrollLeft / max) * (100 - width) + '%';
    });
  };
  LL.initGlobalAnimations = function () {
    if (!motionOK) return;
    if (hasScrollTrigger) {
      window.gsap.utils.toArray('.reveal').forEach(function (el) {
        window.gsap.from(el, { opacity: 0, y: 24, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      document.querySelectorAll('[data-stagger]').forEach(function (group) {
        const children = Array.prototype.slice.call(group.children);
        if (!children.length) return;
        window.gsap.from(children, { opacity: 0, y: 22, stagger: .08, duration: .7, ease: 'power2.out', scrollTrigger: { trigger: group, start: 'top 86%', once: true } });
      });
    } else {
      window.gsap.from('.reveal', { opacity: 0, y: 20, duration: .7, stagger: .06, ease: 'power2.out' });
    }
  };

  /* ------------------------------------------------------------- ready */
  LL.onReady = function (fn) {
    if (LL.ready) fn();
    else document.addEventListener('ll:ready', fn, { once: true });
  };
  function initFromQuery() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('quick')) LL.openQuickView(params.get('quick'));
    if (params.get('cart') === 'open') LL.openCart();
    if (params.get('search') === 'open') LL.openSearch();
    const auto = document.body.dataset.autoOpen;
    if (auto === 'cart') LL.openCart();
    if (auto === 'quick-view') LL.openQuickView(params.get('p') || 'harrow-linen-blazer');
  }
  function init() {
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    const overlays = document.getElementById('site-overlays');
    if (header) header.innerHTML = headerHTML();
    if (footer) footer.innerHTML = footerHTML();
    if (overlays) overlays.innerHTML = overlaysHTML();

    const queryP = new URLSearchParams(window.location.search).get('p');
    if (document.body.dataset.page === 'product' && queryP) LL.addRecent(queryP);

    renderStaticContent();
    LL.renderProducts();
    LL.renderCart(false);
    LL.updateHeaderCounts();
    LL.refreshWishlistButtons();
    LL.initCarousels();
    LL.initGlobalAnimations();

    const sizeModal = document.getElementById('sizeChartModal');
    if (sizeModal) {
      sizeModal.addEventListener('shown.bs.modal', function () {
        if (motionOK) window.gsap.fromTo(sizeModal.querySelector('.modal-dialog'), { y: 18, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .38, ease: 'power3.out' });
      });
    }
    if (!LL.getConsent()) window.setTimeout(function () { showCookie(false); }, 1100);

    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('ll:wishlist-updated', function () { LL.refreshWishlistButtons(); });

    initFromQuery();
    LL.ready = true;
    document.dispatchEvent(new CustomEvent('ll:ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
