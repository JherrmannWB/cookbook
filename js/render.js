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

  /* One recipe card, built from an index summary. Used by the Recipes page
     and the Family Favorites page (which adds a note underneath). */
  function recipeCard(summary) {
    var card = el('li', 'card recipe-card');

    var heading = el('h2', null);
    var link = el('a', null, summary.title);
    link.href = 'recipe.html?id=' + encodeURIComponent(summary.id);
    heading.appendChild(link);
    card.appendChild(heading);

    var metaBits = [summary.difficulty, summary.totalTime].filter(Boolean);
    if (summary.budgetFriendly) metaBits.push('Budget friendly');
    if (metaBits.length) card.appendChild(el('p', 'card-meta', metaBits.join(' · ')));

    if (summary.description) card.appendChild(el('p', null, summary.description));
    if (summary.familyRating) card.appendChild(stars(summary.familyRating));

    return card;
  }

  /* Renders a list of recipe summaries into a container.
     `decorate(card, summary)` optionally adds page-specific extras to each card. */
  function renderRecipeCards(container, summaries, decorate) {
    clear(container);
    if (!summaries.length) {
      container.appendChild(notice('Nothing here yet.', 'Check back soon — the kitchen is always cooking.'));
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
    notice: notice,
    showError: showError,
    stars: stars,
    badge: badge,
    badgeRow: badgeRow,
    formatQuantity: formatQuantity,
    formatIngredient: formatIngredient,
    recipeCard: recipeCard,
    renderRecipeCards: renderRecipeCards,
    recipeLookup: recipeLookup
  };
})();
