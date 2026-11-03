/* Home-only editorial motion: hero zoom, marquee, parallax, pinned lookbook, countdown. */
(function () {
  'use strict';
  LL.onReady(function () {
    if (document.body.dataset.page !== 'home') return;
    const reduce = LL.reduceMotion;
    const gsap = LL.gsap;

    /* A slow, almost imperceptible hero push-in. */
    if (gsap && LL.motionOK) {
      const heroImg = document.querySelector('.hero-media img');
      if (heroImg) gsap.to(heroImg, { scale: 1.075, duration: 16, ease: 'sine.inOut', repeat: -1, yoyo: true, transformOrigin: '50% 42%' });

      /* GSAP-driven marquee; CSS keyframes remain as a no-JS fallback. */
      const track = document.querySelector('.announcement__track');
      if (track) {
        track.style.animation = 'none';
        gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
      }

      /* Full-bleed collection parallax. */
      const banner = document.querySelector('.campaign-banner');
      const bannerImg = document.querySelector('.campaign-banner__image');
      if (banner && bannerImg && LL.ScrollTrigger) {
        gsap.fromTo(bannerImg, { yPercent: -7 }, {
          yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: banner, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }

      /* The swatch rail uses native horizontal overflow scrolling. Applying
         Draggable's scrollLeft wrapper here would collapse its flex children
         into one enormous vertical stack, so it is deliberately left native. */

      /* Pinned horizontal lookbook on desktop. */
      const pin = document.querySelector('.lookbook-pin');
      const lookTrack = document.querySelector('.lookbook-track');
      const progress = document.querySelector('.lookbook-progress span');
      if (pin && lookTrack && LL.ScrollTrigger && window.innerWidth > 992) {
        const distance = function () { return Math.max(1, lookTrack.scrollWidth - window.innerWidth + 36); };
        gsap.to(lookTrack, {
          x: function () { return -distance(); },
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: function () { return '+=' + distance(); },
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: function (self) {
              if (progress) progress.style.width = (18 + self.progress * 82) + '%';
            }
          }
        });
      }
    }

    /* Boxing Day Sale countdown — next 26 December, London time. */
    function nextBoxingDay(now) {
      const year = now.getUTCFullYear();
      let target = new Date(Date.UTC(year, 11, 26, 0, 0, 0));
      if (target.getTime() <= now.getTime()) target = new Date(Date.UTC(year + 1, 11, 26, 0, 0, 0));
      return target;
    }
    const fields = {
      days: document.querySelector('[data-countdown-days]'),
      hours: document.querySelector('[data-countdown-hours]'),
      minutes: document.querySelector('[data-countdown-minutes]'),
      seconds: document.querySelector('[data-countdown-seconds]')
    };
    function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }
    function tick() {
      const diff = nextBoxingDay(new Date()).getTime() - Date.now();
      const total = Math.max(0, Math.floor(diff / 1000));
      const values = {
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60
      };
      Object.keys(fields).forEach(function (key) { if (fields[key]) fields[key].textContent = key === 'days' ? values[key] : pad(values[key]); });
    }
    if (fields.days) { tick(); window.setInterval(tick, 1000); }

    /* Keep carousel progress honest after fonts/images settle. */
    window.addEventListener('load', function () { LL.updateCarouselProgress(); }, { once: true });
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(function () { LL.updateCarouselProgress(); });
      document.querySelectorAll('.carousel-track').forEach(function (t) { ro.observe(t); });
    }
  });
})();
