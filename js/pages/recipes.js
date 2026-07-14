/* Recipes page: renders every recipe card from data/recipes/index.json.
   No recipes are hardcoded — add a JSON file + index entry and it appears. */

(function () {
  'use strict';

  var container = document.getElementById('recipe-list');
  if (!container) return;

  /* Loading and rendering are kept separate on purpose: when search and
     filters arrive, they will simply call render() again with a filtered
     subset of state.recipes — no other changes needed. */
  var state = { recipes: [] };

  function render(recipes) {
    PapawRender.renderRecipeCards(container, recipes);
  }

  PapawData.getRecipeIndex()
    .then(function (index) {
      state.recipes = index.recipes;
      render(state.recipes);
    })
    .catch(function () {
      PapawRender.showError(container, 'The recipe box could not be opened. Please refresh the page.');
    });
})();
