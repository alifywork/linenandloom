# Local vendor assets

Everything used by the storefront is stored in this repository — there are no CDN, Google Fonts, icon API, or remote image requests at runtime.

| Package | Version | Local path | Licence |
| --- | --- | --- | --- |
| Bootstrap | 5.3.8 | `bootstrap/css/bootstrap.min.css`, `bootstrap/js/bootstrap.bundle.min.js` | MIT (`bootstrap/LICENSE`) |
| GSAP + Draggable + ScrollTrigger | 3.15.0 | `gsap/*.min.js` | GSAP Standard "no charge" licence |
| Font Awesome Free | 7.3.1 | `fontawesome/css/all.min.css`, `fontawesome/webfonts/*.woff2` | CC BY 4.0 / SIL OFL 1.1 / MIT (`fontawesome/LICENSE.txt`) |
| Phosphor Icons | 2.1.2 | `phosphor/{regular,bold,fill}/style.css` + `.woff2` | MIT (`phosphor/LICENSE`) |
| Marcellus, Prata, Jost | Fontsource 5.3.0 | `../fonts/*.woff2` | SIL OFL 1.1 (`../fonts/LICENSE-*.txt`) |

Packages were fetched from npm (`registry.npmjs.org`) and only the files actually used were copied here.
