/* Papaw's Kitchen — data helpers.
   All site content lives as JSON under /data; pages load it through here.
   Fetched files are cached so revisiting a page within a session is free. */

window.PapawData = (function () {
  'use strict';

  var cache = {};

  /* getJSON('data/recipes/index.json') -> Promise resolving to parsed JSON */
  function getJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch(path).then(function (response) {
        if (!response.ok) {
          throw new Error('Could not load ' + path + ' (' + response.status + ')');
        }
        return response.json();
      });
    }
    return cache[path];
  }

  /* Recipe summaries for browsing, searching, and filtering (one small file). */
  function getRecipeIndex() {
    return getJSON('data/recipes/index.json');
  }

  /* One full recipe, loaded only when it's opened. */
  function getRecipe(id) {
    return getJSON('data/recipes/' + encodeURIComponent(id) + '.json');
  }

  function getMealPlanIndex() {
    return getJSON('data/meal-plans/index.json');
  }

  /* weekId is e.g. 'week-01' */
  function getMealPlan(weekId) {
    return getJSON('data/meal-plans/' + encodeURIComponent(weekId) + '.json');
  }

  function getProducts() {
    return getJSON('data/approved-products/products.json');
  }

  function getFavorites() {
    return getJSON('data/family-favorites/favorites.json');
  }

  /* Kitchen tips + quick lunch ideas for the dashboard. */
  function getTips() {
    return getJSON('data/tips.json');
  }

  function getStaples() {
    return getJSON('data/staples.json');
  }

  return {
    getJSON: getJSON,
    getRecipeIndex: getRecipeIndex,
    getRecipe: getRecipe,
    getMealPlanIndex: getMealPlanIndex,
    getMealPlan: getMealPlan,
    getProducts: getProducts,
    getFavorites: getFavorites,
    getTips: getTips,
    getStaples: getStaples
  };
})();
