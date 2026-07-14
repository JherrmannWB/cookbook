# Papaw's Kitchen — Architecture

**Status: PROPOSED — awaiting approval before implementation.**

A cookbook website for family, built to be maintained for years. Hosted on
GitHub Pages. No frameworks, no backend, no build tools.

---

## 1. Guiding principles

1. **Content lives in `/data`, presentation lives in HTML/CSS/JS.** Adding a
   recipe should never mean touching HTML.
2. **Boring technology.** Plain files that will still work in 10 years.
3. **The reader comes first.** Large text, high contrast, simple navigation,
   fast loads, printable pages.
4. **Grow without rework.** 100+ recipes, search, filters, meal plans, and
   shopping lists must slot into this structure without restructuring it.

---

## 2. Folder structure

```
cookbook/
├── index.html              Home
├── recipes.html            Browse all recipes (list/cards, later: search + filters)
├── recipe.html             Single-recipe template (reads ?id=..., printable)
├── meal-plans.html         Weekly meal plans
├── products.html           Approved products (Publix)
├── shopping-lists.html     Shopping lists
├── favorites.html          Family favorites
├── about.html              About
├── 404.html                Friendly "page not found"
│
├── css/
│   ├── main.css            Design tokens + layout + components
│   └── print.css           Print stylesheet (recipe cards)
│
├── js/
│   ├── layout.js           Shared header/nav/footer (single source of truth)
│   ├── data.js             Small helpers to fetch/cache JSON from /data
│   └── pages/              One small file per page that needs behavior
│       ├── recipes.js
│       ├── recipe.js
│       └── meal-plans.js
│
├── data/
│   ├── recipes/
│   │   ├── index.json      Summary of every recipe (for browsing/search)
│   │   └── <recipe-id>.json  One file per recipe (full detail)
│   ├── meal-plans/
│   │   ├── index.json      List of available weeks
│   │   └── <YYYY-MM-DD>.json  One file per week (Monday's date)
│   ├── products.json       Approved products
│   └── staples.json        Standing pantry/shopping staples
│
├── images/
│   └── recipes/            One photo per recipe, named by recipe id
│
└── docs/
    └── ARCHITECTURE.md     This document
```

### Why one HTML file per section, not per recipe

GitHub Pages serves static files, and without a build tool, a page per recipe
would mean copy-pasting HTML 100+ times — a maintenance trap. Instead there is
**one** `recipe.html` template; `recipe.html?id=buttermilk-biscuits` fetches
`data/recipes/buttermilk-biscuits.json` and renders it. Fixing the recipe
layout once fixes it for every recipe, forever.

### Shared header/nav/footer

With 8 pages and no build step, duplicated headers drift out of sync the first
time the nav changes. `js/layout.js` holds the header and footer as one
template and injects them into every page. Trade-off: navigation requires
JavaScript. That's acceptable here — the site's core pages already need JS to
render data, each page's `<main>` content remains readable regardless, and
this is a family site, not a public one that must survive with JS disabled.

---

## 3. Content storage: JSON, and why

**Recipes, meal plans, and products are stored as JSON.** The reasoning:

- **Recipes are structured data, not prose.** A recipe is ingredients (with
  quantities and units), steps, times, servings, and tags. Markdown is
  pleasant to write but is just formatted text — a Markdown ingredient list
  can't be summed into a shopping list, filtered by tag, or scaled.
  Every feature on the long-term roadmap (search, filters, favorites,
  seasonal, budget, grocery lists) is a *query over structured data*. JSON
  makes each one a small loop; Markdown would make each one a parsing project.
- **No parser needed.** Browsers read JSON natively (`fetch` +
  `response.json()`). Markdown would require shipping a parsing library —
  the first crack in "no frameworks."
- **Free-text still has a home.** Schema fields like `story` and `notes`
  hold Papaw's headnotes and tips, so warmth isn't sacrificed to structure.

### Index + detail pattern (this is the key scaling decision)

Each collection has a lightweight `index.json` (just enough to render cards,
search, and filter) plus one detail file per item (loaded only when opened).

- Browsing/searching 100+ recipes loads **one small file**, not 100.
- Opening a recipe loads **one more small file**.
- Editing a recipe touches one file — safe for hand-editing, and git diffs
  stay readable.

The only cost: when a recipe is added, its summary is also added to
`index.json`. That's one small entry, documented in the schema, and if it ever
becomes tedious a 20-line local script can regenerate the index — without
changing the architecture.

---

## 4. Data schemas

### Recipe — `data/recipes/<id>.json`

The `id` is the filename and the URL: lowercase, hyphenated, permanent
(e.g. `buttermilk-biscuits`).

```json
{
  "id": "buttermilk-biscuits",
  "title": "Buttermilk Biscuits",
  "story": "Papaw made these every Sunday morning...",
  "category": "breads",
  "tags": ["breakfast", "baking"],
  "seasons": ["all"],
  "familyFavorite": true,
  "servings": "8 biscuits",
  "times": { "prep": "15 minutes", "cook": "12 minutes", "total": "30 minutes" },
  "image": "images/recipes/buttermilk-biscuits.jpg",
  "ingredients": [
    { "item": "all-purpose flour", "quantity": 2, "unit": "cups" },
    { "item": "buttermilk", "quantity": 0.75, "unit": "cup", "note": "cold" }
  ],
  "steps": [
    "Preheat the oven to 450°F.",
    "Whisk the flour, baking powder, and salt together."
  ],
  "notes": ["Handle the dough as little as possible."],
  "approvedProducts": ["publix-buttermilk"],
  "dateAdded": "2026-07-14"
}
```

- Structured `ingredients` power future shopping lists and scaling.
- `tags`, `seasons`, `familyFavorite` power filters, seasonal pages, and the
  Family Favorites page with zero extra storage.
- `approvedProducts` cross-references product ids (section below).

### Recipe index — `data/recipes/index.json`

```json
{
  "recipes": [
    {
      "id": "buttermilk-biscuits",
      "title": "Buttermilk Biscuits",
      "category": "breads",
      "tags": ["breakfast", "baking"],
      "seasons": ["all"],
      "familyFavorite": true,
      "totalTime": "30 minutes",
      "image": "images/recipes/buttermilk-biscuits.jpg"
    }
  ]
}
```

### Weekly meal plan — `data/meal-plans/<YYYY-MM-DD>.json`

One file per week, named by the **Monday** of that week, so "this week's plan"
is computable from today's date. Days reference recipes by id; plain-text
entries (`"Leftovers"`, `"Dinner at Susan's"`) are equally valid.

```json
{
  "weekOf": "2026-07-13",
  "title": "Week of July 13",
  "notes": "Squash is in season.",
  "days": [
    {
      "day": "Monday",
      "meals": [
        { "meal": "Dinner", "recipeId": "chicken-and-dumplings" }
      ]
    },
    {
      "day": "Tuesday",
      "meals": [
        { "meal": "Dinner", "text": "Leftovers" }
      ]
    }
  ]
}
```

`data/meal-plans/index.json` lists available weeks (newest first) for a simple
archive. Because plans reference recipe ids, a future "shopping list for this
week" button is just: collect the week's recipe ids → merge their structured
ingredients → done. The storage format already supports it.

### Approved products — `data/products.json`

A flat file is right here — even hundreds of products is one small file, and
products don't have detail pages.

```json
{
  "products": [
    {
      "id": "publix-buttermilk",
      "name": "Whole Buttermilk",
      "brand": "Publix",
      "store": "Publix",
      "category": "dairy",
      "aisle": "Dairy",
      "notes": "The whole kind, not low-fat.",
      "usedIn": ["buttermilk-biscuits"]
    }
  ]
}
```

`store` is included so the format survives if shopping ever extends beyond
Publix. `price` can be added per-product later for budget tracking without a
format change.

### Staples — `data/staples.json`

Standing pantry items for the Shopping Lists page, grouped by aisle. Future
generated lists (from meal plans) merge on top of these.

### Favorites

`familyFavorite: true` on the recipe itself — no separate list to keep in
sync; the Favorites page just filters the index. A future personal
"my favorites" feature uses `localStorage` (per-device, no backend needed)
and layers on top without any data change.

---

## 5. Presentation layer

### Design tokens (CSS custom properties)

All colors, spacing, and type sizes defined once in `:root` — the whole site's
look is tuned from ~20 lines:

- **Type:** base font size **20px**, generous line-height (1.6+), a warm
  serif for headings, a highly readable font for body text.
- **Color:** warm cream background, deep brown text, one soft accent —
  all pairs meeting **WCAG AA (4.5:1)** contrast, most meeting AAA.
- **Spacing:** a simple scale with lots of air; simple soft-edged cards.

### Accessibility commitments

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page,
  logical heading order.
- Skip-to-content link; visible focus outlines; current page marked with
  `aria-current="page"`.
- Touch targets ≥ 44px; no hover-only interactions; no time-based UI;
  `prefers-reduced-motion` respected.
- Meaningful `alt` text on every image.

### Mobile first & performance

Single-column layouts by default, widening to card grids on larger screens.
System font stack (or at most one hosted font file), no libraries, small
JSON payloads via the index pattern — pages should stay well under 100KB
before photos.

### Print

`css/print.css` makes any recipe print as a clean card: navigation, footer,
and buttons hidden; black on white; ingredients and steps only. "Print this
recipe" is a visible button (many folks don't know Ctrl+P).

---

## 6. How future features land in this architecture

| Future feature | What it takes |
|---|---|
| Search | Filter `recipes/index.json` in JS as the user types — no new data |
| Filters (category/tag/season) | Same index, same page |
| Family favorites | Already a flag; page filters the index |
| Seasonal recipes | Already a field; filter or featured section on Home |
| Printable recipe cards | `print.css`, in from day one |
| Shopping list from a meal plan | Merge structured ingredients of the week's recipes |
| Budget tracking | Add `price` to products; sum over a list |
| Personal favorites | `localStorage`; no data change |
| Photos | Drop image in `images/recipes/`, reference from recipe JSON |
| 500+ recipes someday | Optional 20-line script to regenerate the index; structure unchanged |

---

## 7. Implementation phases (after approval)

1. **Foundation** — folder structure, design tokens, `layout.js`
   (header/nav/footer), Home page, all placeholder pages, 404, responsive +
   print CSS, sample data files establishing the schemas.
2. **Recipes** — browse page rendering from the index; `recipe.html`
   rendering full recipes; print styling verified.
3. **Meal plans & products** — render current week + archive; products page.
4. **Search & filters** — on the recipes page.
5. **Shopping lists** — staples first, then generated-from-meal-plan.
