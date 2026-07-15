/* Papaw's Kitchen — shared rendering helpers.
   Every dynamic page builds its content through these functions, so recipe
   cards, badges, and notices look identical everywhere they appear.
   All content is inserted with textContent (never innerHTML), so nothing
   in a data file can inject markup into the page. */

window.PapawRender = (function () {
  'use strict';

  /* el('p', 'lead', 'Hello') -> <p class="lead">Hello</p> */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null && text !== '') node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /* link('Start Cooking', 'recipe.html?id=x', 'button') -> styled <a>. */
  function link(text, href, className) {
    var a = el('a', className, text);
    a.href = href;
    return a;
  }

  /* Every reference to a recipe page goes through here, so the URL scheme
     lives in exactly one place. */
  function recipeLink(id, title, className) {
    return link(title || id, 'recipe.html?id=' + encodeURIComponent(id), className);
  }

  /* A titled page section: <section class="content-section"><h2>…</h2>. */
  function section(title) {
    var wrap = el('section', 'content-section');
    wrap.appendChild(el('h2', null, title));
    return wrap;
  }

  /* Friendly boxed message, used for "nothing here yet" and load errors. */
  function notice(title, message) {
    var box = el('div', 'notice');
    box.appendChild(el('p', null, '')).appendChild(el('strong', null, title));
    box.appendChild(el('p', null, message));
    return box;
  }

  function showError(container, message) {
    clear(container);
    container.appendChild(
      notice('Something went wrong in the kitchen.', message || 'Please refresh the page and try again.')
    );
  }

  /* '★★★★☆' with a spoken label for screen readers. */
  function stars(rating) {
    var out = el('span', 'stars');
    out.setAttribute('role', 'img');
    out.setAttribute('aria-label', 'Family rating: ' + rating + ' out of 5 stars');
    var text = '';
    for (var i = 1; i <= 5; i++) text += i <= rating ? '★' : '☆';
    out.appendChild(el('span', null, text)).setAttribute('aria-hidden', 'true');
    return out;
  }

  function badge(text, extraClass) {
    return el('span', 'badge' + (extraClass ? ' ' + extraClass : ''), text);
  }

  /* Row of small pills: approvals, "Budget friendly", etc. */
  function badgeRow(badges) {
    var row = el('p', 'badges');
    badges.forEach(function (b) {
      row.appendChild(b);
    });
    return row;
  }

  /* Common ingredient quantities shown as kitchen fractions (0.75 -> "3/4"). */
  var FRACTIONS = { '0.25': '1/4', '0.33': '1/3', '0.5': '1/2', '0.67': '2/3', '0.75': '3/4' };

  function formatQuantity(quantity) {
    if (quantity === null || quantity === undefined || quantity === '') return '';
    var whole = Math.floor(quantity);
    var remainder = Math.round((quantity - whole) * 100) / 100;
    var fraction = FRACTIONS[String(remainder)];
    if (fraction) return (whole > 0 ? whole + ' ' : '') + fraction;
    return String(quantity);
  }

  /* {quantity: 0.75, unit: 'cup', item: 'buttermilk', note: 'cold'}
     -> "3/4 cup buttermilk (cold)" */
  function formatIngredient(ing) {
    var parts = [formatQuantity(ing.quantity), ing.unit, ing.item].filter(Boolean);
    var text = parts.join(' ');
    if (ing.note) text += ' (' + ing.note + ')';
    return text;
  }

  /* Prep/cook/total/servings facts as a definition grid. Used by the recipe
     page and the dashboard's "tonight's dinner" hero. */
  function metaGrid(recipe) {
    var facts = [
      ['Prep', recipe.prepTime],
      ['Cook', recipe.cookTime],
      ['Total', recipe.totalTime],
      ['Serves', recipe.servings],
      ['Difficulty', recipe.difficulty],
      ['Est. cost', recipe.estimatedCost]
    ].filter(function (f) { return f[1]; });

    var dl = el('dl', 'recipe-meta');
    facts.forEach(function (fact) {
      var group = el('div', 'recipe-meta-item');
      group.appendChild(el('dt', null, fact[0]));
      group.appendChild(el('dd', null, fact[1]));
      dl.appendChild(group);
    });
    return dl;
  }

  /* Approval/budget badges for a full recipe. Used by the recipe page and
     the Add-a-Recipe preview, so both always match. */
  function recipeBadges(recipe) {
    var badges = [];
    if (recipe.mamawApproved) badges.push(badge('Mamaw approved ✓', 'badge-sage'));
    if (recipe.papawApproved) badges.push(badge('Papaw approved ✓', 'badge-sage'));
    if (recipe.budgetFriendly) badges.push(badge('Budget friendly'));
    return badges;
  }

  /* <ul class="ingredients"> from a recipe's structured ingredients. */
  function ingredientsList(recipe) {
    var list = el('ul', 'ingredients');
    (recipe.ingredients || []).forEach(function (ing) {
      list.appendChild(el('li', null, formatIngredient(ing)));
    });
    return list;
  }

  /* <ol class="instructions"> from a recipe's steps. */
  function instructionsList(recipe) {
    var steps = el('ol', 'instructions');
    (recipe.instructions || []).forEach(function (step) {
      steps.appendChild(el('li', null, step));
    });
    return steps;
  }

  /* One recipe card, built from an index summary. Used by the Recipes page
     and the Family Favorites page (which adds a note underneath). */
  function recipeCard(summary) {
    var card = el('li', 'card recipe-card');

    var heading = el('h2', null);
    heading.appendChild(recipeLink(summary.id, summary.title));
    card.appendChild(heading);

    var metaBits = [summary.difficulty, summary.totalTime].filter(Boolean);
    if (summary.budgetFriendly) metaBits.push('Budget friendly');
    if (metaBits.length) card.appendChild(el('p', 'card-meta', metaBits.join(' · ')));

    if (summary.description) card.appendChild(el('p', null, summary.description));
    if (summary.familyRating) card.appendChild(stars(summary.familyRating));

    return card;
  }

  /* Renders a list of recipe summaries into a container.
     `decorate(card, summary)` optionally adds page-specific extras to each
     card; `empty` ({title, message}) customizes the friendly empty state. */
  function renderRecipeCards(container, summaries, decorate, empty) {
    clear(container);
    if (!summaries.length) {
      empty = empty || {};
      container.appendChild(notice(
        empty.title || 'Nothing here yet.',
        empty.message || 'Check back soon — the kitchen is always cooking.'
      ));
      return;
    }
    var grid = el('ul', 'card-grid');
    summaries.forEach(function (summary) {
      var card = recipeCard(summary);
      if (decorate) decorate(card, summary);
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  /* Builds an id -> summary lookup from the recipe index, for pages that
     reference recipes by id (meal plans, favorites, products). */
  function recipeLookup(index) {
    var byId = {};
    index.recipes.forEach(function (r) {
      byId[r.id] = r;
    });
    return byId;
  }

  return {
    el: el,
    clear: clear,
    link: link,
    recipeLink: recipeLink,
    section: section,
    notice: notice,
    showError: showError,
    stars: stars,
    badge: badge,
    badgeRow: badgeRow,
    formatQuantity: formatQuantity,
    formatIngredient: formatIngredient,
    metaGrid: metaGrid,
    recipeBadges: recipeBadges,
    ingredientsList: ingredientsList,
    instructionsList: instructionsList,
    recipeCard: recipeCard,
    renderRecipeCards: renderRecipeCards,
    recipeLookup: recipeLookup
  };
})();
