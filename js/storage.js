/* Papaw's Kitchen — the local recipe box.
   Recipes written in the "Add a Recipe" form are kept in the browser's
   localStorage on this device. They appear throughout the site exactly like
   cookbook recipes (data.js merges them in), and can be exported as JSON
   files to join the family cookbook for everyone.
   If localStorage is unavailable (some private-browsing modes), recipes
   fall back to memory for the session rather than breaking the form. */

window.PapawStorage = (function () {
  'use strict';

  var KEY = 'papawsKitchen.myRecipes.v1';
  var memory = [];              /* session fallback when storage is blocked */
  var storageWorks = (function () {
    try {
      localStorage.setItem(KEY + '.test', '1');
      localStorage.removeItem(KEY + '.test');
      return true;
    } catch (e) {
      return false;
    }
  })();

  function list() {
    if (!storageWorks) return memory.slice();
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(recipes) {
    if (!storageWorks) {
      memory = recipes;
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(recipes));
  }

  function get(id) {
    return list().filter(function (r) { return r.id === id; })[0] || null;
  }

  /* Insert or replace by id. Every stored recipe is marked local:true so
     the rest of the site can label it "Saved on this device". */
  function save(recipe) {
    recipe.local = true;
    var recipes = list().filter(function (r) { return r.id !== recipe.id; });
    recipes.push(recipe);
    writeAll(recipes);
    return recipe;
  }

  function remove(id) {
    writeAll(list().filter(function (r) { return r.id !== id; }));
  }

  /* 'Grandma's Chicken Pot Pie' -> 'grandmas-chicken-pot-pie' */
  function slugify(title) {
    return String(title)
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'recipe';
  }

  /* A slug that collides with an existing id gets -2, -3, ... */
  function uniqueId(title, takenIds) {
    var base = slugify(title);
    var id = base;
    var n = 2;
    while (takenIds[id]) {
      id = base + '-' + n;
      n += 1;
    }
    return id;
  }

  return {
    available: storageWorks,
    list: list,
    get: get,
    save: save,
    remove: remove,
    slugify: slugify,
    uniqueId: uniqueId
  };
})();
