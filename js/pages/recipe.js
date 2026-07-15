/* Single recipe page: reads ?id=<recipe-id> from the URL and renders the
   full recipe from data/recipes/<recipe-id>.json. One template serves
   every recipe — fixing the layout here fixes it everywhere. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('recipe-container');
  if (!container) return;

  function render(recipe) {
    R.clear(container);
    document.title = recipe.title + ' — Papaw’s Kitchen';

    var back = R.el('p', 'no-print');
    back.appendChild(R.link('← Back to all recipes', 'recipes.html'));
    container.appendChild(back);

    container.appendChild(R.el('h1', null, recipe.title));
    if (recipe.description) container.appendChild(R.el('p', 'lead', recipe.description));

    if (recipe.familyRating) container.appendChild(R.stars(recipe.familyRating));
    var badges = R.recipeBadges(recipe);
    if (recipe.local) badges.push(R.badge('Saved on this device'));
    if (badges.length) container.appendChild(R.badgeRow(badges));

    container.appendChild(R.metaGrid(recipe));

    /* Local recipes can be edited right from here */
    if (recipe.local) {
      var editRow = R.el('p', 'no-print');
      editRow.appendChild(R.link('Edit this recipe', 'new-recipe.html?id=' + encodeURIComponent(recipe.id)));
      container.appendChild(editRow);
    }

    var printWrap = R.el('p', 'no-print');
    var printButton = R.el('button', 'button', 'Print this recipe');
    printButton.type = 'button';
    printButton.addEventListener('click', function () { window.print(); });
    printWrap.appendChild(printButton);
    container.appendChild(printWrap);

    if (recipe.whyWeChoseThis && recipe.whyWeChoseThis.length) {
      var why = R.section('Why We Chose This');
      var whyList = R.el('ul', 'why-list');
      recipe.whyWeChoseThis.forEach(function (reason) {
        whyList.appendChild(R.el('li', null, reason));
      });
      why.appendChild(whyList);
      container.appendChild(why);
    }

    var ingredients = R.section('Ingredients');
    ingredients.appendChild(R.ingredientsList(recipe));
    container.appendChild(ingredients);

    var instructions = R.section('Instructions');
    instructions.appendChild(R.instructionsList(recipe));
    container.appendChild(instructions);

    if (recipe.notes && recipe.notes.length) {
      var notes = R.section('Kitchen notes');
      var noteList = R.el('ul', null);
      recipe.notes.forEach(function (note) {
        noteList.appendChild(R.el('li', null, note));
      });
      notes.appendChild(noteList);
      container.appendChild(notes);
    }

    if (recipe.leftovers || recipe.storage) {
      var keeping = R.section('Leftovers & storage');
      if (recipe.leftovers) keeping.appendChild(R.el('p', null, recipe.leftovers));
      if (recipe.storage) keeping.appendChild(R.el('p', null, recipe.storage));
      container.appendChild(keeping);
    }
  }

  function showMissing() {
    R.clear(container);
    container.appendChild(R.el('h1', null, 'Recipe not found'));
    container.appendChild(
      R.notice('We couldn’t find that recipe.', 'It may have been renamed. Try the recipe list instead.')
    );
    var back = R.el('p', null);
    back.appendChild(R.link('← Back to all recipes', 'recipes.html'));
    container.appendChild(back);
  }

  var id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    showMissing();
    return;
  }

  PapawData.getRecipe(id).then(render).catch(showMissing);
})();
