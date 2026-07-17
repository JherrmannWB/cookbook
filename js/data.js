/* Papaw's Kitchen — data helpers.
   All site content lives as JSON under /data; pages load it through here.
   Fetched files are cached so revisiting a page within a session is free. */

window.PapawData = (function () {
  'use strict';

  var cache = {};

  /* getJSON('data/recipes/index.json') -> Promise resolving to parsed JSON.
     Successes are cached for the session; failures are NOT cached, so a
     hiccup (spotty Wi-Fi, mid-deploy fetch) recovers on the next try. */
  function getJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch(path)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Could not load ' + path + ' (' + response.status + ')');
          }
          return response.json();
        })
        .catch(function (error) {
          delete cache[path];
          throw error;
        });
    }
    return cache[path];
  }

  /* Summary entry for a full recipe — same shape as data/recipes/index.json */
  function toSummary(recipe) {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      mealType: recipe.mealType,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      totalTime: recipe.totalTime,
      tags: recipe.tags || [],
      budgetFriendly: !!recipe.budgetFriendly,
      freezerFriendly: !!recipe.freezerFriendly,
      mamawApproved: !!recipe.mamawApproved,
      familyFavorite: !!recipe.familyFavorite,
      greatLeftovers: !!recipe.greatLeftovers,
      papawEasy: !!recipe.papawEasy,
      protein: recipe.protein,
      cuisine: recipe.cuisine,
      budgetTier: recipe.budgetTier,
      cookingMethod: recipe.cookingMethod,
      familyRating: recipe.familyRating,
      featured: !!recipe.featured,
      status: recipe.status,
      dateAdded: recipe.dateAdded,
      image: recipe.image || null,
      local: true
    };
  }

  function localRecipes() {
    return typeof PapawStorage !== 'undefined' ? PapawStorage.list() : [];
  }

  /* Recipe summaries for browsing, searching, and filtering.
     Recipes saved on this device (the local recipe box) are merged in and,
     when one shares an id with a cookbook recipe, the local copy wins —
     so an edited copy shadows the original on this device. */
  function getRecipeIndex() {
    return getJSON('data/recipes/index.json').then(function (index) {
      var local = localRecipes();
      if (!local.length) return index;

      var localIds = {};
      var summaries = local.map(function (recipe) {
        localIds[recipe.id] = true;
        return toSummary(recipe);
      });
      var site = index.recipes.filter(function (r) { return !localIds[r.id]; });
      return { recipes: site.concat(summaries) };
    });
  }

  /* One full recipe, loaded only when it's opened. Local copies win here
     too, so links to an edited recipe open the edited version. */
  function getRecipe(id) {
    if (typeof PapawStorage !== 'undefined') {
      var local = PapawStorage.get(id);
      if (local) return Promise.resolve(local);
    }
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

  /* Kitchen tips + quick lunch ideas for the dashboard and tips page. */
  function getTips() {
    return getJSON('data/tips.json');
  }

  /* Cooking basics: the little how-tos every kitchen relies on. */
  function getBasics() {
    return getJSON('data/basics.json');
  }

  /* The master ingredient library. */
  function getIngredients() {
    return getJSON('data/ingredients/index.json');
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
    getBasics: getBasics,
    getIngredients: getIngredients,
    getStaples: getStaples
  };
})();
