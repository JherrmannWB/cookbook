/* Single recipe page: reads ?id=<recipe-id> from the URL and renders the
   full recipe from data/recipes/<recipe-id>.json. One template serves
   every recipe — fixing the layout here fixes it everywhere. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('recipe-container');
  if (!container) return;

  function approvalBadges(recipe) {
    var badges = [];
    if (recipe.mamawApproved) badges.push(R.badge('Mamaw approved ✓', 'badge-sage'));
    if (recipe.papawApproved) badges.push(R.badge('Papaw approved ✓', 'badge-sage'));
    if (recipe.budgetFriendly) badges.push(R.badge('Budget friendly'));
    return badges;
  }

  function render(recipe) {
    R.clear(container);
    document.title = recipe.title + ' — Papaw’s Kitchen';

    var back = R.el('p', 'no-print');
    back.appendChild(R.link('← Back to all recipes', 'recipes.html'));
    container.appendChild(back);

    container.appendChild(R.el('h1', null, recipe.title));
    if (recipe.description) container.appendChild(R.el('p', 'lead', recipe.description));

    if (recipe.familyRating) container.appendChild(R.stars(recipe.familyRating));
    var badges = approvalBadges(recipe);
    if (badges.length) container.appendChild(R.badgeRow(badges));

    container.appendChild(R.metaGrid(recipe));

    var printWrap = R.el('p', 'no-print');
    var printButton = R.el('button', 'button', 'Print this recipe');
    printButton.type = 'button';
    printButton.addEventListener('click', function () { window.print(); });
    printWrap.appendChild(printButton);
    container.appendChild(printWrap);

    var ingredients = R.section('Ingredients');
    var ingList = R.el('ul', 'ingredients');
    (recipe.ingredients || []).forEach(function (ing) {
      ingList.appendChild(R.el('li', null, R.formatIngredient(ing)));
    });
    ingredients.appendChild(ingList);
    container.appendChild(ingredients);

    var instructions = R.section('Instructions');
    var steps = R.el('ol', 'instructions');
    (recipe.instructions || []).forEach(function (step) {
      steps.appendChild(R.el('li', null, step));
    });
    instructions.appendChild(steps);
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
