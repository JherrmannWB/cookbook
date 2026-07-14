# Papaw's Kitchen 🥣

Our family cookbook: recipes, weekly meal plans, approved products, and
shopping lists. Built with plain HTML, CSS, and JavaScript — no frameworks,
no build tools — and hosted on GitHub Pages.

## Running it locally

Any static file server works. The simplest:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening the HTML files directly from disk
won't load the JSON data — browsers block `fetch` on `file://` URLs.)

## Adding content

All content lives under `data/` as JSON — you never need to touch HTML to
add a recipe. Two steps to add one:

1. Create `data/recipes/<recipe-id>.json` (copy an existing recipe as a
   starting point).
2. Add a matching summary entry to `data/recipes/index.json`.

The recipe id is lowercase-with-hyphens and never changes (it's the URL).
Photos go in `images/recipes/`, named by recipe id.

Weekly meal plans live in `data/meal-plans/`, one file per week named by the
Monday of that week (`2026-07-13.json`), plus an entry in its `index.json`.

## Architecture

The full design — folder structure, data schemas, and how future features
(search, filters, generated shopping lists) fit in — is documented in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Read it before making
structural changes.
