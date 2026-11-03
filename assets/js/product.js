/* Product detail: gallery, sticky options, reviews, related edits and mobile bar. */
(function () {
  'use strict';
  LL.onReady(function () {
    if (document.body.dataset.page !== 'product') return;
    const params = new URLSearchParams(window.location.search);
    const p = LL.getProduct(params.get('p')) || LL.data.products[0];
    document.body.dataset.productId = p.id;
    document.title = p.name + ' | LINEN & LOOM';
    LL.addRecent(p.id);

    document.querySelectorAll('[data-breadcrumb-current]').forEach(function (el) { el.textContent = p.name; });
    document.querySelectorAll('[data-pdp-breadcrumb-category]').forEach(function (el) {
      el.textContent = p.category;
      el.href = 'category.html?c=' + p.slug;
    });
    document.querySelectorAll('[data-pdp-review-score]').forEach(function (el) { el.textContent = p.rating.toFixed(1); });
    document.querySelectorAll('[data-pdp-review-count]').forEach(function (el) { el.textContent = p.reviewCount + ' verified reviews'; });

    const sizeLabel = p.slug === 'unstitched-fabric' ? 'Length' : (p.slug === 'accessories' ? 'Size' : 'UK size');
    const galleryImages = [
      { src: p.image, alt: p.name },
      { src: p.hover, alt: 'Alternate view of ' + p.name },
      { src: 'assets/images/swatch-03.jpg', alt: 'Cloth detail for ' + p.name },
      { src: 'assets/images/campaign-pair.jpg', alt: 'Styled with the LINEN & LOOM collection' }
    ];

    const gallery = document.querySelector('[data-pdp-gallery]');
    if (gallery) {
      gallery.innerHTML = galleryImages.map(function (img, i) {
        return '<div class="pdp-image"' + (i === 0 ? ' data-pdp-main-image' : '') + '><img src="' + img.src + '" alt="' + LL.escapeHTML(img.alt) + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '"></div>';
      }).join('') + '<div class="pdp-thumbs">' + galleryImages.map(function (img, i) {
        return '<button class="pdp-thumb' + (i === 0 ? ' is-active' : '') + '" type="button" data-pdp-thumb="' + i + '" aria-label="View image ' + (i + 1) + '"><img src="' + img.src + '" alt=""></button>';
      }).join('') + '</div>';
      gallery.addEventListener('mousemove', function (e) {
        const frame = e.target.closest('.pdp-image');
        if (!frame) return;
        const r = frame.getBoundingClientRect();
        frame.style.setProperty('--zoom-x', ((e.clientX - r.left) / r.width * 100) + '%');
        frame.style.setProperty('--zoom-y', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      gallery.addEventListener('click', function (e) {
        const thumb = e.target.closest('[data-pdp-thumb]');
        if (!thumb) return;
        const i = Number(thumb.dataset.pdpThumb);
        const main = gallery.querySelector('[data-pdp-main-image] img');
        if (main && galleryImages[i]) { main.src = galleryImages[i].src; main.alt = galleryImages[i].alt; }
        gallery.querySelectorAll('.pdp-thumb').forEach(function (b) { b.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    }

    function optionButtons(values, type) {
      return values.map(function (value, i) {
        if (type === 'size') return '<button class="size-option' + (i === 0 ? ' is-active' : '') + '" type="button" data-size="' + LL.escapeHTML(value) + '" aria-pressed="' + (i === 0) + '">' + LL.escapeHTML(value) + '</button>';
        return '<button class="color-option' + (i === 0 ? ' is-active' : '') + '" type="button" data-color="' + LL.escapeHTML(value.name) + '" aria-label="' + LL.escapeHTML(value.name) + '" aria-pressed="' + (i === 0) + '"><span style="background:' + value.hex + '"></span></button>';
      }).join('');
    }
    function accordionItem(id, title, body, open) {
      return '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button' + (open ? '' : ' collapsed') + '" type="button" data-bs-toggle="collapse" data-bs-target="#' + id + '" aria-expanded="' + open + '" aria-controls="' + id + '">' + title + '</button></h2><div id="' + id + '" class="accordion-collapse collapse' + (open ? ' show' : '') + '" data-bs-parent="#pdpAccordion"><div class="accordion-body">' + body + '</div></div></div>';
    }

    const info = document.querySelector('[data-pdp-info]');
    if (info) {
      const details = '<ul>' + p.details.map(function (d) { return '<li>' + LL.escapeHTML(d) + '</li>'; }).join('') + '</ul>';
      info.dataset.optionScope = 'pdp';
      info.dataset.productId = p.id;
      info.innerHTML = `
<div class="pdp-info__top">
  <div><span class="eyebrow">${LL.escapeHTML(p.category)} · ${LL.escapeHTML(p.occasion)}</span></div>
  <button class="icon-btn" type="button" data-wishlist="${p.id}" aria-label="Add to wishlist"><i class="fa-regular fa-heart"></i></button>
</div>
<h1>${LL.escapeHTML(p.name)}</h1>
<div class="pdp-rating"><span class="stars">★★★★★</span><span>${p.rating.toFixed(1)} · <a href="#reviews">${p.reviewCount} reviews</a></span></div>
<div class="pdp-price">${LL.priceHTML(p)}</div>
<div class="pdp-vat">VAT included · Klarna 3 interest-free payments available at checkout</div>
<p class="small-copy">${LL.escapeHTML(p.description)}</p>

<div class="pdp-option">
  <div class="pdp-option__label"><span>Colour · <span data-color-name>${LL.escapeHTML(p.colors[0].name)}</span></span><span>${p.colors.length} tones</span></div>
  <div class="pdp-colors"><div class="color-options">${optionButtons(p.colors, 'color')}</div></div>
</div>
<div class="pdp-option">
  <div class="pdp-option__label"><span>${sizeLabel} · <span data-size-label>${LL.escapeHTML(p.sizes[0])}</span></span><button type="button" data-open-size-chart><i class="fa-solid fa-ruler"></i> Size guide</button></div>
  <div class="pdp-sizes">${optionButtons(p.sizes, 'size')}</div>
</div>
<div class="pdp-actions">
  <div class="qty-stepper" data-qty-stepper><button type="button" data-qty-minus aria-label="Decrease quantity"><i class="ph ph-minus"></i></button><span data-qty-value>1</span><button type="button" data-qty-plus aria-label="Increase quantity"><i class="ph ph-plus"></i></button></div>
  <button class="btn-editorial" type="button" data-add-to-cart="${p.id}">Add to bag <i class="fa-solid fa-cart-plus"></i></button>
</div>
<button class="btn-outline pdp-buy" type="button" data-buy-now="${p.id}">Buy now <i class="ph ph-arrow-right"></i></button>
<button class="btn-ghost pdp-wishlist" type="button" data-wishlist="${p.id}"><i class="fa-regular fa-heart"></i> <span data-wishlist-text>Add to wishlist</span></button>

<div class="pdp-delivery-note"><i class="fa-solid fa-truck-fast"></i><span><strong>Free UK delivery over £120</strong><br>${LL.escapeHTML(p.delivery)} · Ships across the EU</span></div>
<div class="pdp-trust-row">
  <div class="pdp-trust"><i class="fa-solid fa-rotate-left"></i>28-day free UK returns</div>
  <div class="pdp-trust"><i class="fa-solid fa-lock"></i>Secure checkout</div>
  <div class="pdp-trust"><i class="fa-solid fa-leaf"></i>Considered cloth</div>
</div>
<div class="pdp-share">
  <span>Share</span>
  <a href="#" data-toast="Share on Instagram" aria-label="Share on Instagram"><i class="fa-brands fa-instagram"></i></a>
  <a href="#" data-toast="Share on Pinterest" aria-label="Share on Pinterest"><i class="fa-brands fa-pinterest-p"></i></a>
  <a href="#" data-toast="Share on Facebook" aria-label="Share on Facebook"><i class="fa-brands fa-facebook-f"></i></a>
  <a href="#" data-copy-link aria-label="Copy product link"><i class="fa-solid fa-link"></i></a>
</div>
<div class="accordion pdp-accordion" id="pdpAccordion">
  ${accordionItem('pdpDescription', 'Description', '<p>' + LL.escapeHTML(p.description) + '</p>' + details, true)}
  ${accordionItem('pdpFabric', 'Fabric &amp; Care', '<p><strong>Cloth:</strong> ' + LL.escapeHTML(p.fabric) + '</p><p><strong>Care:</strong> ' + LL.escapeHTML(p.care) + '</p>', false)}
  ${accordionItem('pdpSize', 'Size Guide', '<p>' + LL.escapeHTML(p.fit) + ' Graded to UK sizes 6–18.</p><button class="btn-ghost btn-sm-editorial" type="button" data-open-size-chart>Open conversion chart</button>', false)}
  ${accordionItem('pdpDelivery', 'Delivery &amp; Returns', '<p>' + LL.escapeHTML(p.delivery) + '. Royal Mail Tracked 48 is free on UK orders over £120. EU delivery is calculated at checkout and VAT is included in the displayed price.</p><a class="text-link" href="shipping-returns.html">Full policy <i class="ph ph-arrow-up-right"></i></a>', false)}
</div>`;
      LL.syncAddButton(info);
      LL.refreshWishlistButtons();
    }

    const relatedTrack = document.querySelector('[data-products="related"]');
    if (relatedTrack) {
      const related = LL.data.products.filter(function (x) { return x.id !== p.id && x.slug === p.slug; }).slice(0, 8);
      LL.renderProductCards(relatedTrack, related, 'No related pieces yet.');
    }
    const completeGrid = document.querySelector('[data-products="complete"]');
    if (completeGrid) {
      const complete = (p.pairWith || []).map(LL.getProduct).filter(Boolean).slice(0, 4);
      LL.renderProductCards(completeGrid, complete, 'No styling suggestions yet.');
    }
    LL.renderRecentlyViewed();

    const mobileBar = document.querySelector('[data-mobile-add-bar]');
    if (mobileBar) {
      const name = mobileBar.querySelector('[data-mobile-name]');
      const price = mobileBar.querySelector('[data-mobile-price]');
      const button = mobileBar.querySelector('[data-mobile-add]');
      if (name) name.textContent = p.name;
      if (price) price.textContent = LL.money(p.price);
      if (button) button.dataset.mobileAdd = p.id;
    }

    function selectedOptions() {
      LL.syncAddButton(info);
      const add = info && info.querySelector('[data-add-to-cart]');
      return {
        qty: Number((add && add.dataset.qty) || 1),
        size: (add && add.dataset.size) || p.sizes[0],
        color: (add && add.dataset.color) || p.colors[0].name
      };
    }
    document.addEventListener('click', function (e) {
      const target = e.target instanceof Element ? e.target : e.target.parentElement;
      if (!target) return;
      if (target.closest('[data-buy-now]')) {
        e.preventDefault();
        const o = selectedOptions();
        LL.buyNow(p.id, o.qty, o.size, o.color);
      } else if (target.closest('[data-mobile-add]')) {
        e.preventDefault();
        const o = selectedOptions();
        LL.addToCart(p.id, o.qty, o.size, o.color);
        LL.openCart();
      } else if (target.closest('[data-copy-link]')) {
        e.preventDefault();
        const url = window.location.href;
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { LL.toast('Product link copied'); }).catch(function () { LL.toast('Copy this page URL to share'); });
        else LL.toast('Copy this page URL to share');
      }
    });
  });
})();
