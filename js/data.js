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

  function getRecipeIndex() {
    return getJSON('data/recipes/index.json');
  }

  function getRecipe(id) {
    return getJSON('data/recipes/' + encodeURIComponent(id) + '.json');
  }

  function getMealPlanIndex() {
    return getJSON('data/meal-plans/index.json');
  }

  function getMealPlan(weekOf) {
    return getJSON('data/meal-plans/' + encodeURIComponent(weekOf) + '.json');
  }

  function getProducts() {
    return getJSON('data/products.json');
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
    getStaples: getStaples
  };
})();
