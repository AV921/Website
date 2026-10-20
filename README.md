# Andrea Vennarucci — Website

Static HTML website hosted on GitHub Pages at https://andreavennarucci.com.
No production dependencies or build step are required.

## Local preview

Run `python -m http.server 8000`, then open http://localhost:8000.

## Structure

- Six HTML pages contain the content and their English/Italian dictionaries.
- `assets/site.js` handles shared navigation, translation rendering, language metadata, preference storage and motion settings.
- `assets/site.css` contains shared accessibility styles; the other stylesheets preserve each page's layout.
- `image/` retains original artwork alongside responsive WebP variants. HTML `srcset` selects an appropriate size; above-the-fold hero images load eagerly.
- `sitemap.xml` and canonical metadata use the apex domain consistently.

## Checks

Run `python scripts/check-site.py` for local links, fragment targets, image attributes and metadata.
For browser regression checks: `npm install --no-save --package-lock=false playwright@1.62.1`, `npx playwright install chromium`, then `node scripts/browser-check.cjs`.
GitHub Actions runs these checks at mobile and desktop widths and saves screenshots as an artifact.

## Content updates

Keep English and Italian dictionaries aligned. Update each page's description, Open Graph metadata and sitemap date when its content changes.
When replacing artwork, regenerate proportional WebP sizes and update `src`, `srcset`, `sizes`, `width` and `height` together. Keep decorative card images lazy-loaded; do not lazy-load the main hero.

The contact form intentionally opens the visitor's email client. Direct delivery requires a separately configured mail service; no form data is sent to a new third party.
