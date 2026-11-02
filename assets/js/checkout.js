/* Checkout summary, VAT line, Klarna 3-split and front-end order confirmation. */
(function () {
  'use strict';
  LL.onReady(function () {
    if (document.body.dataset.page !== 'checkout') return;
    const itemsWrap = document.querySelector('[data-checkout-items]');
    const form = document.querySelector('[data-checkout-form]');
    const success = document.querySelector('[data-checkout-success]');
    const alert = document.querySelector('[data-checkout-empty]');

    function shippingCost() {
      const checked = document.querySelector('[data-shipping]:checked');
      return checked ? Number(checked.value) : 0;
    }
    function totals() {
      const cart = LL.getCart();
      const subtotal = cart.reduce(function (sum, item) { const p = LL.getProduct(item.id); return sum + (p ? p.price * Number(item.qty) : 0); }, 0);
      const shipping = shippingCost();
      const total = subtotal + shipping;
      return { cart: cart, subtotal: subtotal, shipping: shipping, total: total, vat: total / 6 };
    }
    function set(selector, value) {
      document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; });
    }
    function render() {
      const t = totals();
      if (itemsWrap) {
        itemsWrap.innerHTML = t.cart.length ? t.cart.map(function (item) {
          const p = LL.getProduct(item.id);
          return '<div class="checkout-summary__line"><img src="' + p.image + '" alt="' + LL.escapeHTML(p.name) + '"><div><strong>' + LL.escapeHTML(p.name) + '</strong><small>' + LL.escapeHTML(item.size) + ' · ' + LL.escapeHTML(item.color) + ' · Qty ' + item.qty + '</small></div><span class="price">' + LL.money(p.price * item.qty) + '</span></div>';
        }).join('') : '<div class="empty-state" style="padding:34px 14px"><i class="fa-solid fa-bag-shopping"></i><h3>Your bag is empty</h3><p>Add a piece before checking out.</p></div>';
      }
      set('[data-checkout-subtotal]', LL.money(t.subtotal));
      set('[data-checkout-shipping]', t.shipping === 0 ? 'Free' : LL.money(t.shipping));
      set('[data-checkout-vat]', LL.money(t.vat) + ' included');
      set('[data-checkout-total]', LL.money(t.total));
      set('[data-klarna-total]', LL.money(t.total));
      set('[data-klarna-split]', LL.money(t.total / 3));
      set('[data-checkout-count]', t.cart.length + (t.cart.length === 1 ? ' item' : ' items'));
      if (alert) alert.style.display = t.cart.length ? 'none' : 'block';
      if (form) {
        const submit = form.querySelector('[type="submit"]');
        if (submit) submit.disabled = !t.cart.length;
      }
    }

    document.querySelectorAll('[data-shipping]').forEach(function (radio) { radio.addEventListener('change', render); });
    document.addEventListener('ll:cart-updated', render);
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!LL.getCart().length) { LL.toast('Your bag is empty'); return; }
      if (!form.checkValidity()) { form.reportValidity(); LL.toast('Please complete the required fields'); return; }
      const orderNo = 'LL-' + String(Date.now()).slice(-6);
      if (success) {
        success.hidden = false;
        success.querySelector('[data-order-number]').textContent = orderNo;
        success.scrollIntoView({ behavior: LL.reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
      form.hidden = true;
      LL.clearCart();
      LL.toast('Order placed — no payment was taken in this demo');
    });
    render();
  });
})();
