/* Shop filtering, sorting and URL presets — entirely client-side/local. */
(function () {
  'use strict';
  LL.onReady(function () {
    if (document.body.dataset.page !== 'shop') return;

    const grid = document.querySelector('[data-shop-grid]');
    const count = document.querySelector('[data-result-count]');
    const activeWrap = document.querySelector('[data-active-filters]');
    const range = document.querySelector('[data-price-range]');
    const priceOutput = document.querySelector('[data-price-output]');
    const sortSelect = document.querySelector('[data-sort]');
    const saleBox = document.querySelector('[data-filter-sale]');
    const clearBtn = document.querySelector('[data-clear-filters]');
    const params = new URLSearchParams(window.location.search);
    let occasion = params.get('occasion') || '';

    /* Preselect from URL: sale, category, sort and occasion links. */
    const presetCategory = params.get('category') || params.get('c') || '';
    if (presetCategory) {
      document.querySelectorAll('[data-filter-category]').forEach(function (box) { box.checked = box.value === presetCategory; });
    }
    if (params.get('sale') === '1' && saleBox) saleBox.checked = true;
    if (params.get('sort') && sortSelect) sortSelect.value = params.get('sort');

    function checkedValues(selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (el) { return el.checked; }).map(function (el) { return el.value; });
    }
    function activeColors() {
      return Array.prototype.slice.call(document.querySelectorAll('[data-filter-color].is-active')).map(function (el) { return el.dataset.color; });
    }
    function filters() {
      const f = {
        categories: checkedValues('[data-filter-category]'),
        sizes: checkedValues('[data-filter-size]'),
        colors: activeColors(),
        maxPrice: range ? Number(range.value) : 300,
        sale: Boolean(saleBox && saleBox.checked),
        occasion: occasion
      };
      return f;
    }
    function labelForCategory(slug) {
      const c = LL.data.bySlug(slug);
      return c ? c.title : slug;
    }
    function renderActive(f) {
      if (!activeWrap) return;
      const chips = [];
      if (f.sale) chips.push({ type: 'sale', value: '1', label: 'Boxing Day Sale' });
      if (f.occasion) chips.push({ type: 'occasion', value: f.occasion, label: f.occasion.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) });
      f.categories.forEach(function (v) { chips.push({ type: 'category', value: v, label: labelForCategory(v) }); });
      f.sizes.forEach(function (v) { chips.push({ type: 'size', value: v, label: 'UK ' + v }); });
      f.colors.forEach(function (v) { chips.push({ type: 'color', value: v, label: v }); });
      if (f.maxPrice < 300) chips.push({ type: 'price', value: '300', label: 'Under ' + LL.money(f.maxPrice) });
      activeWrap.innerHTML = chips.length ? chips.map(function (c) {
        return '<span class="active-filter">' + LL.escapeHTML(c.label) + '<button type="button" data-remove-filter data-type="' + c.type + '" data-value="' + LL.escapeHTML(c.value) + '" aria-label="Remove ' + LL.escapeHTML(c.label) + ' filter"><i class="ph ph-x"></i></button></span>';
      }).join('') : '<span class="small-copy">No active filters — showing the full edit.</span>';
    }
    function apply() {
      if (!grid) return;
      const f = filters();
      let list = LL.filterProducts(f);
      list = LL.sortProducts(list, sortSelect ? sortSelect.value : 'featured');
      LL.renderProductCards(grid, list, 'No pieces match those filters. Try clearing a size or colour.');
      if (count) count.textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
      if (priceOutput) priceOutput.textContent = LL.money(f.maxPrice);
      renderActive(f);
    }

    document.querySelectorAll('[data-filter-category], [data-filter-size], [data-filter-sale]').forEach(function (el) { el.addEventListener('change', apply); });
    if (range) range.addEventListener('input', apply);
    if (sortSelect) sortSelect.addEventListener('change', apply);
    document.querySelectorAll('[data-filter-color]').forEach(function (btn) {
      btn.addEventListener('click', function () { btn.classList.toggle('is-active'); apply(); });
    });
    if (activeWrap) activeWrap.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-remove-filter]');
      if (!btn) return;
      const type = btn.dataset.type, value = btn.dataset.value;
      if (type === 'sale' && saleBox) saleBox.checked = false;
      else if (type === 'category') document.querySelectorAll('[data-filter-category]').forEach(function (box) { if (box.value === value) box.checked = false; });
      else if (type === 'size') document.querySelectorAll('[data-filter-size]').forEach(function (box) { if (box.value === value) box.checked = false; });
      else if (type === 'color') document.querySelectorAll('[data-filter-color]').forEach(function (b) { if (b.dataset.color === value) b.classList.remove('is-active'); });
      else if (type === 'price' && range) range.value = 300;
      else if (type === 'occasion') {
        occasion = '';
        const url = new URL(window.location.href);
        url.searchParams.delete('occasion');
        window.history.replaceState({}, '', url);
      }
      apply();
    });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      document.querySelectorAll('[data-filter-category], [data-filter-size], [data-filter-sale]').forEach(function (box) { box.checked = false; });
      document.querySelectorAll('[data-filter-color]').forEach(function (b) { b.classList.remove('is-active'); });
      if (range) range.value = 300;
      if (sortSelect) sortSelect.value = 'featured';
      occasion = '';
      const url = new URL(window.location.href);
      ['sale', 'category', 'c', 'occasion', 'sort'].forEach(function (k) { url.searchParams.delete(k); });
      window.history.replaceState({}, '', url);
      apply();
      LL.toast('Filters cleared');
    });

    apply();
  });
})();
