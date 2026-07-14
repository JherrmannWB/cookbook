/* Family Favorites page: renders the curated list from
   data/family-favorites/favorites.json. Each entry references a recipe by
   id — the card itself is built from the recipe index, never duplicated. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('favorites-list');
  if (!container) return;

  Promise.all([PapawData.getFavorites(), PapawData.getRecipeIndex()])
    .then(function (results) {
      var favorites = results[0].favorites;
      var recipesById = R.recipeLookup(results[1]);

      /* Notes keyed by recipe id, so each card can say why it's a favorite. */
      var notesById = {};
      favorites.forEach(function (fav) {
        notesById[fav.recipeId] = fav;
      });

      var summaries = favorites
        .map(function (fav) { return recipesById[fav.recipeId]; })
        .filter(Boolean);

      R.renderRecipeCards(container, summaries, function (card, summary) {
        var fav = notesById[summary.id];
        if (fav && fav.note) {
          var note = R.el('p', 'favorite-note', '“' + fav.note + '”');
          if (fav.addedBy) note.appendChild(R.el('span', 'favorite-by', ' — ' + fav.addedBy));
          card.appendChild(note);
        }
      });
    })
    .catch(function () {
      R.showError(container, 'The favorites could not be loaded. Please refresh the page.');
    });
})();
