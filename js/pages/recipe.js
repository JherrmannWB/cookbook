/* Single recipe page: reads ?id=<recipe-id> from the URL and renders the
   full recipe from data/recipes/<recipe-id>.json. One template serves
   every recipe — fixing the layout here fixes it everywhere. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('recipe-container');
  if (!container) return;

  /* The editorial checklist: derive from the recipe data whatever the data
     can prove; only genuine judgment calls live in recipe.checklist. */
  var CHECKLIST_ITEMS = [
    ['Ingredients complete', function (r) { return (r.ingredients || []).length > 0; }],
    ['Instructions reviewed', function (r) { return !!(r.checklist && r.checklist.instructionsReviewed); }],
    ['Estimated cost entered', function (r) { return !!r.estimatedCost; }],
    ['Storage instructions entered', function (r) { return !!r.storage; }],
    ['Leftover notes entered', function (r) { return !!r.leftovers; }],
    ['Why We Chose This completed', function (r) { return !!(r.whyWeChoseThis && r.whyWeChoseThis.length); }],
    ['Ingredient review completed', function (r) { return !!(r.checklist && r.checklist.ingredientReviewCompleted); }],
    ['Mamaw Approved', function (r) { return !!r.mamawApproved; }],
    ['Yuka field reviewed', function (r) { return !!(r.checklist && r.checklist.yukaReviewed); }],
    ['Photo added', function (r) { return !!r.image; }]
  ];

  /* Origin · version · last updated · status — the recipe's colophon. */
  function colophon(recipe) {
    var bits = [];
    if (recipe.origin) bits.push(recipe.origin);
    if (recipe.version) bits.push('v' + recipe.version);
    if (recipe.lastUpdated) bits.push('Last updated ' + R.formatDate(recipe.lastUpdated));

    var line = R.el('p', 'recipe-colophon', bits.join(' · '));
    var status = R.statusBadge(recipe.status);
    if (status) {
      if (bits.length) line.appendChild(document.createTextNode(' '));
      line.appendChild(status);
    }
    return bits.length || status ? line : null;
  }

  /* Shown only before publication: what's done, what's left. */
  function editorialChecklist(recipe) {
    var done = 0;
    var items = CHECKLIST_ITEMS.map(function (item) {
      var complete = item[1](recipe);
      if (complete) done += 1;
      return { label: item[0], complete: complete };
    });

    var panel = R.el('details', 'editorial-panel no-print');
    var summary = R.el('summary', null,
      'Editorial checklist — ' + done + ' of ' + items.length + ' complete');
    panel.appendChild(summary);

    var list = R.el('ul', 'checklist');
    items.forEach(function (item) {
      var li = R.el('li', item.complete ? 'check-done' : 'check-open');
      li.appendChild(R.el('span', 'check-mark', item.complete ? '✓' : '□'))
        .setAttribute('aria-hidden', 'true');
      li.appendChild(document.createTextNode(' ' + item.label));
      if (!item.complete) li.appendChild(R.el('span', 'visually-hidden', ' — not done yet'));
      list.appendChild(li);
    });
    panel.appendChild(list);

    panel.appendChild(R.el('p', 'card-meta',
      done === items.length
        ? 'Every item is complete — this recipe is ready for publication.'
        : (items.length - done) + ' item' + (items.length - done === 1 ? '' : 's') + ' to go before publication.'));
    return panel;
  }

  /* Dated editorial notes — the living-cookbook journal. */
  function journal(recipe) {
    var wrap = R.section('Recipe Journal');
    wrap.classList.add('no-print');
    var list = R.el('ul', 'journal');
    recipe.editorialNotes.forEach(function (entry) {
      var li = R.el('li', null);
      li.appendChild(R.el('strong', 'journal-date', R.formatDate(entry.date)));
      li.appendChild(R.el('span', null, ' — ' + entry.note));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function render(recipe) {
    R.clear(container);
    document.title = recipe.title + ' — Papaw’s Kitchen';

    var back = R.el('p', 'no-print');
    back.appendChild(R.link('← Back to all recipes', 'recipes.html'));
    container.appendChild(back);

    container.appendChild(R.el('h1', null, recipe.title));
    var meta = colophon(recipe);
    if (meta) container.appendChild(meta);
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

    /* The pre-publication checklist appears only while a recipe is on its
       way to Published — readers of the finished cookbook never see it. */
    if (recipe.status && recipe.status !== 'published') {
      container.appendChild(editorialChecklist(recipe));
    }

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

    if (recipe.editorialNotes && recipe.editorialNotes.length) {
      container.appendChild(journal(recipe));
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
