# Papaw's Kitchen — Architecture

**Status: IMPLEMENTED** (Sprint 1: foundation · Sprint 2: data-driven
content · Sprint 3: kitchen dashboard · Sprint 4: polish & UX ·
Sprint 5: recipe management · Sprint 6: content foundation ·
Publishing Cycle 1: editorial workflow)

## Editorial workflow

Recipes carry a publishing lifecycle and a colophon:

- **`status`**: `draft` → `under-review` → `tested` → `published`
  (→ `archived`). A small status chip renders in the recipe's colophon.
  Archived recipes leave the Recipes list (their pages stay reachable);
  the dashboard features and "recently published" count only published
  recipes. Recipes without a status predate the workflow and are treated
  as published.
- **Colophon**: `origin` (Family Recipe / YouTube / Cookbook / Friend /
  Website / Original), `version` (semantic, e.g. `2.0`), `lastUpdated` —
  displayed under the title and included in print.
- **Editorial checklist**: shown (collapsed) on any non-published recipe.
  Seven of the ten items are DERIVED from the recipe data itself
  (ingredients present, cost/storage/leftovers/why entered, Mamaw
  Approved, photo added); only true judgment calls are stored, in
  `checklist`: `instructionsReviewed`, `ingredientReviewCompleted`,
  `yukaReviewed`. Derived items can never drift out of sync.
- **`editorialNotes`**: dated entries (`{date: "2026-07", note}`)
  rendered as the "Recipe Journal" — the living-cookbook record.
  Screen-only; it doesn't print.
- **Search metadata** (for the future search sprint): `protein`,
  `cuisine`, `mealType`, `seasons`, `budgetTier`, `difficulty`,
  `cookingMethod` — on every recipe and in the index.
- **Products**: `dateReviewed`, `reviewedBy`, and `yukaVerified`; the
  Yuka score displays only when `yukaVerified` is true, otherwise always
  "Ask Jake to verify".
- The Add-a-Recipe form covers status/origin/version and the search
  metadata, stamps `lastUpdated` on save, and carries through the fields
  it doesn't edit (journal, checklist, photo, product links) untouched.

## The badge system

Five standard badges, rendered by ONE function (`PapawRender.recipeBadges`)
for anything carrying the flags — recipe summaries, full recipes, and
approved products — so they look identical everywhere:

🟢 Mamaw Approved (`mamawApproved`) · ❤️ Family Favorite (`familyFavorite`)
· 💰 Budget Friendly (`budgetFriendly`) · ♻️ Great Leftovers
(`greatLeftovers`) · 👨‍🍳 Papaw Easy (`papawEasy`)

Recipes and products also carry `whyWeChoseThis` (an array of short
reasons) explaining why they belong in Papaw's Kitchen. Products carry
`yukaScore`, which defaults to the string **"Ask Jake to verify"** —
never an invented number; Jake replaces it by hand once verified.
The Family Favorites page is driven by the `familyFavorite` flag, with
`data/family-favorites/favorites.json` contributing the family's quotes.

A cookbook website for family, built to be maintained for years. Hosted on
GitHub Pages. No frameworks, no backend, no build tools.

---

## 1. Guiding principles

1. **Content lives in `/data`, presentation lives in HTML/CSS/JS.** Adding a
   recipe never means touching HTML — create a JSON file, add one index
   entry, and it appears everywhere automatically.
2. **Boring technology.** Plain files that will still work in 10 years.
3. **The reader comes first.** Large text, high contrast, simple navigation,
   fast loads, printable pages.
4. **Grow without rework.** 100+ recipes, 12 rotating meal plans, hundreds of
   products, search, and filters must slot in without restructuring.

---

## 2. Folder structure

```
cookbook/
├── index.html              Home
├── recipes.html            Browse all recipes (rendered from data)
├── recipe.html             Single-recipe template (reads ?id=..., printable)
├── new-recipe.html         Add/edit recipes in the browser (?id= to edit)
├── meal-plans.html         Rotating weekly plans (reads ?week=...)
├── products.html           Approved products, grouped by category
├── tips.html               Kitchen Tips (all of data/tips.json)
├── basics.html             Cooking Basics (from data/basics.json)
├── shopping-lists.html     Shopping lists (grocery lists live in meal plans)
├── favorites.html          Family favorites (curated, rendered from data)
├── about.html              About
├── 404.html                Friendly "page not found" (self-contained)
│
├── css/
│   ├── main.css            Design tokens + layout + components
│   └── print.css           Print stylesheet (recipe cards)
│
├── js/
│   ├── layout.js           Shared header/nav/footer (single source of truth)
│   ├── storage.js          Local recipe box in localStorage (PapawStorage)
│   ├── data.js             Fetch + cache JSON from /data (PapawData)
│   ├── render.js           Reusable rendering helpers (PapawRender)
│   ├── schedule.js         Week rotation + day/money helpers (PapawSchedule)
│   └── pages/              One small script per dynamic page
│       ├── home.js         Kitchen dashboard
│       ├── recipes.js
│       ├── recipe.js
│       ├── recipe-form.js  Add-a-Recipe authoring form
│       ├── meal-plans.js
│       ├── products.js
│       └── favorites.js
│
├── data/
│   ├── recipes/
│   │   ├── index.json      Summary of every recipe (browse/search/filter)
│   │   └── <recipe-id>.json  One file per recipe (full detail)
│   ├── meal-plans/
│   │   ├── index.json      List of rotating weeks
│   │   └── week-NN.json    One file per week (grocery list, budget, prep,
│   │                       lunch + dinner schedules)
│   ├── approved-products/
│   │   └── products.json   Every approved product as its own record
│   ├── family-favorites/
│   │   └── favorites.json  Curated list of recipe ids + why we love them
│   ├── tips.json           Kitchen tips + quick lunch ideas
│   ├── basics.json         Cooking basics (how-tos, conversions, safety)
│   └── staples.json        Standing pantry staples (future shopping lists)
│
├── images/
│   └── recipes/            One photo per recipe, named by recipe id
│
├── .github/workflows/
│   └── pages.yml           Deploys the site to GitHub Pages on push to main
│
└── docs/
    └── ARCHITECTURE.md     This document
```

### Why one HTML file per section, not per recipe

GitHub Pages serves static files, and without a build tool, a page per recipe
would mean copy-pasting HTML 100+ times — a maintenance trap. Instead there is
**one** `recipe.html` template; `recipe.html?id=buttermilk-biscuits` fetches
`data/recipes/buttermilk-biscuits.json` and renders it. Fixing the recipe
layout once fixes it for every recipe, forever. Meal plans work the same way:
`meal-plans.html?week=week-02`.

### Shared header/nav/footer

`js/layout.js` holds the header and footer as one template and injects them
into every page, so eight pages never drift out of sync. Trade-off:
navigation requires JavaScript — acceptable because the content pages already
render from data, and each page's `<main>` remains readable regardless.

### JavaScript layering (separation of concerns)

- **`data.js` (PapawData)** — the only code that knows where JSON lives.
  Fetches and caches; every page loads content through it.
- **`render.js` (PapawRender)** — the only code that builds shared UI
  (recipe cards, badges, star ratings, meta grids, notices, ingredient
  formatting). A recipe card looks identical on Recipes and Family
  Favorites, and the recipe meta grid is the same on the recipe page and
  the dashboard hero, because they call the same functions.
- **`schedule.js` (PapawSchedule)** — domain logic for the rotating weeks:
  which week is active today, day names, money parsing/formatting. Used by
  the dashboard and by Meal Plans (which defaults to the current week).
- **`js/pages/*.js`** — one small script per page that connects the two:
  load data, hand it to render functions. Each keeps **loading separate
  from rendering**, so search/filters later just call `render()` again
  with a filtered subset — no other changes.

All dynamic content is inserted via `textContent` (never `innerHTML`), so
nothing typed into a data file can inject markup into the page.

---

## 3. Content storage: JSON, and why

**Everything is JSON.** Recipes are structured data, not prose — ingredients
with quantities, steps, times, tags, ratings. Every roadmap feature (search,
filters, favorites, seasonal, budget, grocery lists) is a *query over
structured data*: JSON makes each one a small loop, Markdown would make each
one a parsing project. Browsers also parse JSON natively — no library needed.
Free-text warmth lives in schema fields (`description`, `notes`, favorite
quotes), so nothing is sacrificed to structure.

### Index + detail pattern (the key scaling decision)

Recipes have a lightweight `index.json` (just enough to render cards, search,
and filter) plus one detail file per recipe (loaded only when opened).
Browsing 100+ recipes loads **one small file**; opening a recipe loads one
more. Editing touches one file, so hand-edits are safe and git diffs stay
readable.

The cost: adding a recipe means also adding its summary entry to
`index.json`. If that ever becomes tedious, a 20-line local script can
regenerate the index without changing the architecture.

---

## 4. Data schemas

### Recipe — `data/recipes/<id>.json`

The `id` is the filename and the URL: lowercase, hyphenated, permanent.

```json
{
  "id": "lemon-garlic-chicken",
  "title": "Lemon Garlic Chicken",
  "description": "Juicy chicken thighs roasted with lemon...",
  "category": "main-dishes",
  "difficulty": "Easy",
  "prepTime": "10 minutes",
  "cookTime": "35 minutes",
  "totalTime": "45 minutes",
  "servings": "4 servings",
  "estimatedCost": "$11",
  "budgetFriendly": true,
  "image": null,
  "ingredients": [
    { "item": "chicken thighs", "quantity": 8, "unit": "", "note": "bone-in" }
  ],
  "instructions": ["Preheat the oven to 425°F.", "..."],
  "tags": ["dinner", "chicken", "one-pan"],
  "seasons": ["all"],
  "notes": ["Optional kitchen tips."],
  "leftovers": "Keeps 3 days in the refrigerator.",
  "storage": "Store covered; reheat at 325°F.",
  "familyRating": 5,
  "mamawApproved": true,
  "papawApproved": true,
  "featured": false,
  "approvedProducts": ["publix-buttermilk"],
  "dateAdded": "2026-07-14"
}
```

- Structured `ingredients` (`quantity`/`unit`/`item`/`note`) power future
  shopping-list generation and scaling; the renderer shows quantities as
  kitchen fractions (0.75 → "3/4").
- `tags`, `seasons`, `featured`, `budgetFriendly`, `familyRating` power
  future search, filters, seasonal pages, and a featured section — no new
  storage needed.
- `approvedProducts` cross-references product ids.

### Recipe index — `data/recipes/index.json`

One summary entry per recipe: `id`, `title`, `description`, `category`,
`difficulty`, `prepTime`, `totalTime`, `tags`, `budgetFriendly`,
`familyRating`, `featured`, `image`. **When adding a recipe, add its entry
here too.**

### Meal plan — `data/meal-plans/week-NN.json`

Rotating numbered weeks (`week-01` … `week-12`), not calendar dates. Meals
reference recipes **by id only** (never duplicated); plain-text entries
("Leftovers", "Fish night") are equally valid, and either kind may carry a
`note`.

**Which week is "now"?** `data/meal-plans/index.json` holds
`rotationStart` — the Monday the rotation began. `schedule.js` computes
today's week from it (weeks cycle in index order forever), so the dashboard
and the Meal Plans page always know the current week with zero upkeep.
Weeks also carry `budget` and `estimatedTotal` for the dashboard's budget
card.

```json
{
  "id": "week-01",
  "title": "Week 1 — Comfort Classics",
  "budget": "$85",
  "notes": "Squash is in season.",
  "sundayPrep": ["Simmer the chicken for Monday.", "..."],
  "lunches": [
    { "day": "Monday", "text": "Egg salad sandwiches" },
    { "day": "Sunday", "recipeId": "buttermilk-biscuits" }
  ],
  "dinners": [
    { "day": "Monday", "recipeId": "chicken-and-dumplings" },
    { "day": "Tuesday", "recipeId": "squash-casserole", "note": "with sliced tomatoes" }
  ],
  "groceryList": [
    { "section": "Produce", "items": ["2 lbs yellow squash", "3 carrots"] }
  ]
}
```

`data/meal-plans/index.json` lists the weeks (`id`, `title`, `budget`).
Because meals reference recipe ids, a future "build my shopping list"
feature merges the week's structured ingredients automatically.

### Approved products — `data/approved-products/products.json`

Every product is its own record. One flat file is right here — even hundreds
of products is a small file, and products have no detail pages.

```json
{
  "id": "publix-buttermilk",
  "name": "Whole Buttermilk",
  "category": "Dairy",
  "store": "Publix",
  "notes": "The whole kind, not low-fat.",
  "approved": true,
  "favorite": true,
  "image": null,
  "usedIn": ["buttermilk-biscuits"]
}
```

`store` keeps the format honest if shopping ever extends beyond Publix;
`image` is a placeholder for product photos; `price` can be added later for
budget tracking without a format change.

### Family favorites — `data/family-favorites/favorites.json`

A curated list referencing recipes by id, with a note on why it's loved:

```json
{
  "favorites": [
    { "recipeId": "chicken-and-dumplings",
      "note": "The dish that ends every argument at the table.",
      "addedBy": "Mamaw" }
  ]
}
```

The Favorites page builds its cards from the recipe index — recipe details
are never duplicated. A future personal "my favorites" feature layers on
with `localStorage` (per-device, no backend) without touching this data.

### Tips — `data/tips.json`

Two lists the dashboard draws from at random: `tips` (one kitchen tip per
page load) and `quickLunches` (the fallback suggestion when tomorrow has no
planned lunch).

### The local recipe box (recipe management)

GitHub Pages has no server, so the browser cannot write into `data/`.
The Add-a-Recipe page (`new-recipe.html`) therefore works in two stages:

1. **Save to This Device** stores the recipe in localStorage
   (`storage.js`). `data.js` merges local recipes into every recipe read,
   so they instantly appear on Recipes, the dashboard, favorites-by-id,
   and meal plans — indistinguishable from cookbook recipes except for a
   quiet "Saved on this device" badge. A local recipe that shares an id
   with a cookbook recipe **shadows** it on that device (that's how
   "editing" a cookbook recipe works without a server).
2. **Download Recipe File** exports the exact JSON for
   `data/recipes/<id>.json` — same schema, `local` flag stripped. Commit
   it (plus an index entry) and the recipe joins the cookbook for
   everyone; the device copy can then be deleted.

`new-recipe.html?id=<recipe-id>` opens any recipe for editing: local ones
in place, cookbook ones as a device copy. Validation requires only a
title, one ingredient, and one step; quantities accept kitchen fractions
("1 1/2" → 1.5). The preview is built from the same shared render
functions as the real recipe page, so it is never a lie. If localStorage
is blocked (some private-browsing modes), the form still works for the
session and steers the author toward Download.

### The dashboard (home page)

`js/pages/home.js` composes everything above and hardcodes nothing:
tonight's dinner hero (full recipe details + Start Cooking button, or the
plan's plain-text entry), the week's dinner cards with today highlighted,
tomorrow's lunch (looked up across the week boundary on Sunday nights),
the budget card with progress bar, one `featured` recipe, and a random tip.

---

## 5. Presentation layer

### Design tokens (CSS custom properties)

All colors, spacing, and type sizes defined once in `:root`:

- **Type:** base font size **20px**, line-height 1.65, warm serif headings,
  highly readable system font for body text.
- **Color:** warm cream background, deep brown text, terracotta accent —
  all pairs meeting **WCAG AA (4.5:1)** contrast, most meeting AAA.
- **Spacing:** a simple scale with lots of air; soft-edged cards.

### Accessibility commitments

- Semantic landmarks, one `h1` per page, logical heading order.
- Skip-to-content link; visible focus outlines; current page and current
  week marked with `aria-current="page"`.
- Touch targets ≥ 44px; no hover-only interactions; no hidden menus —
  every page is always one tap away.
- Star ratings carry spoken labels ("Family rating: 5 out of 5 stars");
  meaningful `alt` text on every image.
- `prefers-reduced-motion` respected.

### Mobile first & performance

Single-column layouts by default, widening to card grids on larger screens.
System fonts, no libraries, small JSON payloads via the index pattern.

### Print

`css/print.css` strips navigation, footer, and controls from any page;
recipe pages print as clean black-on-white cards via a visible
"Print this recipe" button.

---

## 6. How future features land in this architecture

| Future feature | What it takes |
|---|---|
| Search | Filter the recipe index in JS; pages already separate load from render |
| Filters (category/tag/season/difficulty) | Same index, same `render()` call |
| Featured recipes on Home | `featured` flag already exists; filter the index |
| Seasonal recipes | `seasons` field already exists |
| Shopping list from a meal plan | Merge structured ingredients of the week's recipe ids |
| Budget tracking | Add `price` to products; sum over a list |
| Personal favorites | `localStorage`; no data change |
| Photos | Drop image in `images/recipes/`, set the recipe's `image` field |
| 500+ recipes someday | Optional 20-line script to regenerate the index |

---

## 7. Adding content (quick reference)

**A recipe:** copy an existing `data/recipes/*.json`, edit, save as
`<recipe-id>.json`, add a summary entry to `data/recipes/index.json`.
It appears automatically in Recipes, and can be referenced by meal plans
and favorites immediately.

**A meal plan week:** copy an existing `week-NN.json`, edit, add the week to
`data/meal-plans/index.json`.

**A product:** add one record to `data/approved-products/products.json`.

**A favorite:** add `{ recipeId, note, addedBy }` to
`data/family-favorites/favorites.json`.
