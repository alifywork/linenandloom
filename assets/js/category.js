/* One category template, four category views driven by ?c=... */
(function () {
  'use strict';
  LL.onReady(function () {
    if (document.body.dataset.page !== 'category') return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('c') || 'ready-to-wear';
    const category = LL.data.bySlug(slug) || LL.data.categories[1];
    document.body.dataset.categoryId = category.slug;

    function setText(selector, value) {
      document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; });
    }
    setText('[data-category-title]', category.title);
    setText('[data-category-tile]', category.tile);
    setText('[data-category-eyebrow]', category.eyebrow);
    setText('[data-category-description]', category.description);
    setText('[data-breadcrumb-current]', category.title);
    document.title = category.title + ' | LINEN & LOOM';

    document.querySelectorAll('[data-category-image]').forEach(function (img) { img.src = category.image; img.alt = category.title; });
    document.querySelectorAll('[data-category-hover]').forEach(function (img) { img.src = category.hover; });
    document.querySelectorAll('[data-category-icon]').forEach(function (icon) { icon.className = 'category-hero__icon ' + category.icon; });
    document.querySelectorAll('[data-category-chip]').forEach(function (chip) { chip.classList.toggle('is-active', chip.dataset.categoryChip === category.slug); });

    const grid = document.querySelector('[data-category-grid]');
    if (grid) {
      grid.dataset.category = category.slug;
      const list = LL.data.products.filter(function (p) { return p.slug === category.slug; });
      LL.renderProductCards(grid, list, 'Nothing in this edit just yet — explore the full shop.');
      const count = document.querySelector('[data-category-count]');
      if (count) count.textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
    }
  });
})();
