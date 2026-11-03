/* Small page-specific interactions for editorial and service pages. */
(function () {
  'use strict';
  LL.onReady(function () {
    const page = document.body.dataset.page;

    /* ------------------------------------------------------- blog single */
    if (page === 'blog-single') {
      const params = new URLSearchParams(window.location.search);
      const post = LL.data.blogPosts.find(function (b) { return b.slug === params.get('post'); }) || LL.data.blogPosts[0];
      const bodies = {
        'quiet-art-of-weaving': {
          lede: 'A finished cloth rarely announces the hours inside it. We went back to the beginning — to the warp, the weft and the hands that keep them in tension.',
          quote: '“Good cloth does not ask to be noticed. It asks to be lived in.”',
          sections: [
            ['Before the first thread', 'Every LINEN & LOOM fabric begins with a question about weight, drape and how a garment will feel after a hundred wears. For our Belgian linen we look for a slightly irregular slub: the tiny variations that catch daylight and prove the cloth was woven, not printed into perfection.'],
            ['The rhythm of the loom', 'Three warp threads held in tension, one weft drawn across. Repeat that movement slowly enough and a metre of cloth becomes a record of attention. Our mill partners work in short runs, which lets us adjust the finish without over-producing.'],
            ['Cut in Shoreditch', 'The cloth arrives at 48 Redchurch Street as a roll, not a garment. Patterns are drafted on the studio table, cut in small batches, and sewn by people who can see the whole piece rather than a single seam.']
          ],
          images: ['assets/images/story-weaving.jpg', 'assets/images/fabric-rolls.jpg']
        },
        'a-shoreditch-address': {
          lede: 'Our atelier is not a showroom with a back room. It is one long, light-filled space where fittings, fabric tables and the sewing machines share the same floor.',
          quote: '“Come for a fitting, stay for the cloth.”',
          sections: [
            ['48 Redchurch Street', 'We chose Shoreditch because it still makes things. Brick walls, studio stairwells and a street that changes every season — a fitting backdrop for clothes designed around real lives rather than a fantasy.'],
            ['What happens upstairs', 'On any given morning you will find a size 12 toile on the stand, a stack of oat linen waiting to be cut, and a handwritten note about a sleeve adjustment. The shop front is deliberately quiet; the work is visible if you look.'],
            ['Visit us', 'Appointments are available Tuesday to Saturday. Walk-ins are welcome for accessories and fabric by the metre, and our fit notes travel with you if you would rather shop online.']
          ],
          images: ['assets/images/london-street.jpg', 'assets/images/atelier-rack.jpg']
        },
        'living-with-linen': {
          lede: 'Linen is often described as difficult. In truth it is simply honest: it creases, it softens, and it improves with a little less interference.',
          quote: '“Let linen move. The crease is part of the cloth, not a flaw in it.”',
          sections: [
            ['Washing', 'Use a cool, gentle cycle or hand wash, and skip fabric softener — linen relaxes naturally. Wash tonal colours together and remove the piece while it is still slightly damp.'],
            ['Pressing', 'Press on the reverse with a warm iron and a little steam. For a relaxed wardrobe, a light press at the collar and placket is often enough; the body can keep its lived-in texture.'],
            ['Storing', 'Hang tailoring on broad wooden hangers and fold knitwear or fabric lengths flat. Keep cloth out of direct sunlight so oat, chalk and flax tones stay even.']
          ],
          images: ['assets/images/blog-linen.jpg', 'assets/images/swatch-06.jpg']
        }
      };
      const body = bodies[post.slug] || {
        lede: post.excerpt,
        quote: '“A smaller wardrobe, chosen with more care.”',
        sections: [
          ['The edit', post.excerpt + ' We start with silhouette, then cloth, then the small details that make a piece worth returning to.'],
          ['How we wear it', 'Neutral tones hold their own together: oat with chalk, champagne with espresso, a single maroon note when the outfit needs a point of view.'],
          ['The LINEN & LOOM note', 'Everything is made in small runs, graded to UK sizes 6–18, and finished with free 28-day UK returns so the decision never has to be rushed.']
        ],
        images: [post.image, 'assets/images/lookbook-04.jpg']
      };
      const set = function (sel, value) { document.querySelectorAll(sel).forEach(function (el) { el.textContent = value; }); };
      set('[data-blog-title]', post.title);
      set('[data-blog-category]', post.category);
      set('[data-blog-date]', post.date);
      set('[data-blog-author]', post.author);
      set('[data-blog-readtime]', post.readTime);
      set('[data-breadcrumb-current]', post.title);
      document.title = post.title + ' | LINEN & LOOM Journal';
      document.querySelectorAll('[data-blog-hero]').forEach(function (img) { img.src = post.hero; img.alt = post.title; });
      const article = document.querySelector('[data-blog-article-body]');
      if (article) {
        article.innerHTML = '<p class="lede">' + LL.escapeHTML(body.lede) + '</p>' +
          '<h2>' + LL.escapeHTML(body.sections[0][0]) + '</h2><p>' + LL.escapeHTML(body.sections[0][1]) + '</p>' +
          '<figure class="article-figure"><img src="' + body.images[0] + '" alt="Editorial detail"><figcaption>Inside the LINEN &amp; LOOM cloth archive, Shoreditch.</figcaption></figure>' +
          '<blockquote class="pull-quote">' + LL.escapeHTML(body.quote) + '</blockquote>' +
          '<h2>' + LL.escapeHTML(body.sections[1][0]) + '</h2><p>' + LL.escapeHTML(body.sections[1][1]) + '</p>' +
          '<h2>' + LL.escapeHTML(body.sections[2][0]) + '</h2><p>' + LL.escapeHTML(body.sections[2][1]) + '</p>' +
          '<figure class="article-figure"><img src="' + body.images[1] + '" alt="Fabric and atelier detail"><figcaption>Considered cloth, before the cut.</figcaption></figure>' +
          '<p>Explore the pieces made from this cloth in <a class="text-link" href="shop.html">the full edit</a>, or read our <a class="text-link" href="size-guide.html">UK size guide</a> before choosing your fit.</p>';
      }
      document.addEventListener('click', function (e) {
        const t = e.target instanceof Element ? e.target : e.target.parentElement;
        if (t && t.closest('[data-copy-article]')) {
          e.preventDefault();
          const url = window.location.href;
          if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { LL.toast('Article link copied'); }).catch(function () { LL.toast('Copy this page URL to share'); });
          else LL.toast('Copy this page URL to share');
        }
      });
    }

    /* --------------------------------------------------------------- FAQ */
    if (page === 'faq') {
      const input = document.querySelector('[data-faq-search]');
      const items = Array.prototype.slice.call(document.querySelectorAll('[data-faq-item]'));
      const empty = document.querySelector('[data-faq-empty]');
      if (input) input.addEventListener('input', function () {
        const q = input.value.trim().toLowerCase();
        let visible = 0;
        items.forEach(function (item) {
          const match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
          item.style.display = match ? '' : 'none';
          if (match) visible += 1;
        });
        if (empty) empty.hidden = visible !== 0;
      });
    }

    /* ------------------------------------------------------- track order */
    if (page === 'track-order') {
      const form = document.querySelector('[data-track-form]');
      const result = document.querySelector('[data-track-result]');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); LL.toast('Please enter an order number and email'); return; }
        const number = form.querySelector('[name="order"]').value.trim().toUpperCase();
        const email = form.querySelector('[name="email"]').value.trim();
        if (result) {
          result.hidden = false;
          result.querySelectorAll('[data-track-order]').forEach(function (el) { el.textContent = number; });
          result.querySelectorAll('[data-track-email]').forEach(function (el) { el.textContent = email; });
          result.querySelectorAll('.track-step').forEach(function (step, i) { step.classList.toggle('is-done', i < 3); });
          result.scrollIntoView({ behavior: LL.reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
        }
        LL.toast('Tracking status updated — this is a front-end demonstration');
      });
    }

    /* ---------------------------------------------------------- contact */
    if (page === 'contact') {
      const form = document.querySelector('[data-contact-form]');
      const success = document.querySelector('[data-contact-success]');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); LL.toast('Please complete the required fields'); return; }
        if (success) { success.hidden = false; success.scrollIntoView({ behavior: LL.reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); }
        form.reset();
        LL.toast('Thank you — the atelier will reply within one working day');
      });
    }
  });
})();
