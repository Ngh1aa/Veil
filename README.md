# Atelier Veil

Static GitHub Pages website built with plain HTML, CSS and JavaScript. No framework, package installation or build command is required.

## Project structure

```text
Veil/
├── index.html              # Page structure and content sections
├── css/
│   ├── base.css            # Design tokens, reset, typography, utilities
│   ├── components.css      # Header, cards, buttons, loader
│   └── sections.css        # Hero, collection, mood, shop, journal, footer
├── js/
│   ├── data.js             # Fragrances, products and testimonials
│   └── app.js              # Rendering, navigation and interactions
└── assets/                 # Images and hero video
```

## Edit content

- Change product, fragrance or testimonial content in `js/data.js`.
- Change page headings and static content in `index.html`.
- Change colors and fonts through the variables at the top of `css/base.css`.
- Change interactions in `js/app.js`.

## Local preview

Run a static server from the repository root:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## GitHub Pages

All internal files use relative paths such as `./assets/...`, so the site works correctly from the project URL `/Veil/` without a router or special base-path configuration.
