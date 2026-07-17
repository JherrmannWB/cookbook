/* Add a Recipe — the recipe authoring form.
   Writes recipes in the exact same JSON shape as data/recipes/*.json.
   Saving keeps the recipe in the local recipe box (localStorage), where it
   immediately appears across the site; Download exports the JSON file that
   can be committed to data/recipes/ for the whole family.
   Opening new-recipe.html?id=<recipe-id> edits that recipe — a local one in
   place, or a cookbook one as a personal copy that shadows the original. */

(function () {
  'use strict';

  var R = PapawRender;
  var S = PapawStorage;
  var form = document.getElementById('recipe-form');
  if (!form) return;

  var byId = function (id) { return document.getElementById(id); };
  var state = {
    editingId: null,   /* keep this id when saving an edit */
    takenIds: {},      /* every id in the cookbook + local box (for new ids) */
    dateAdded: null,   /* preserved across edits */
    carry: {}          /* fields the form doesn't edit (journal, checklist,
                          photo, product links) — carried through a save
                          untouched instead of being wiped */
  };

  var CARRY_FIELDS = ['image', 'seasons', 'approvedProducts', 'checklist', 'editorialNotes'];

  /* ---- Dynamic ingredient + step rows ----------------------------------- */

  function ingredientRow(ing) {
    ing = ing || {};
    var row = R.el('div', 'ing-row');

    var qty = R.el('input', 'ing-qty');
    qty.type = 'text';
    qty.placeholder = 'Amount';
    qty.setAttribute('aria-label', 'Amount');
    qty.value = ing.quantity === null || ing.quantity === undefined
      ? '' : R.formatQuantity(ing.quantity);

    var unit = R.el('input', 'ing-unit');
    unit.type = 'text';
    unit.placeholder = 'Unit (cups…)';
    unit.setAttribute('aria-label', 'Unit');
    unit.value = ing.unit || '';

    var item = R.el('input', 'ing-item');
    item.type = 'text';
    item.placeholder = 'Ingredient';
    item.setAttribute('aria-label', 'Ingredient');
    item.value = ing.item || '';

    var note = R.el('input', 'ing-note');
    note.type = 'text';
    note.placeholder = 'Note (chopped, cold…)';
    note.setAttribute('aria-label', 'Note');
    note.value = ing.note || '';

    var remove = R.el('button', 'row-remove', 'Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove this ingredient');
    remove.addEventListener('click', function () { row.remove(); });

    [qty, unit, item, note, remove].forEach(function (n) { row.appendChild(n); });
    return row;
  }

  function instructionRow(text) {
    var row = R.el('div', 'step-row');
    var input = R.el('textarea', 'step-text');
    input.rows = 2;
    input.placeholder = 'What to do…';
    input.setAttribute('aria-label', 'Step');
    input.value = text || '';

    var remove = R.el('button', 'row-remove', 'Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove this step');
    remove.addEventListener('click', function () { row.remove(); });

    row.appendChild(input);
    row.appendChild(remove);
    return row;
  }

  function addIngredient(ing) {
    byId('ingredient-rows').appendChild(ingredientRow(ing));
  }

  function addInstruction(text) {
    byId('instruction-rows').appendChild(instructionRow(text));
  }

  /* ---- Reading the form ------------------------------------------------- */

  /* '3/4' -> 0.75, '1 1/2' -> 1.5, '2' -> 2, '' -> null, 'a pinch' -> NaN */
  function parseQuantity(text) {
    var t = String(text || '').trim();
    if (!t) return null;
    var mixed = t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    var fraction = t.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    var n = Number(t);
    return isNaN(n) ? NaN : n;
  }

  function splitLines(text) {
    return String(text || '').split('\n')
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
  }

  function splitTags(text) {
    return String(text || '').split(',')
      .map(function (t) { return t.trim().toLowerCase().replace(/\s+/g, '-'); })
      .filter(Boolean);
  }

  /* Collects the form into a recipe object plus any validation problems. */
  function collect() {
    var errors = [];

    var title = byId('f-title').value.trim();
    if (!title) errors.push({ field: 'f-title', error: 'err-title' });

    var ingredients = [];
    var rows = byId('ingredient-rows').querySelectorAll('.ing-row');
    Array.prototype.forEach.call(rows, function (row) {
      var item = row.querySelector('.ing-item').value.trim();
      var qtyInput = row.querySelector('.ing-qty');
      var quantity = parseQuantity(qtyInput.value);
      var unit = row.querySelector('.ing-unit').value.trim();
      var note = row.querySelector('.ing-note').value.trim();

      if (!item && !qtyInput.value.trim() && !unit && !note) return; /* blank row */

      if (isNaN(quantity)) {
        errors.push({ field: qtyInput, message: 'Amounts should be numbers like 2 or 3/4 — or leave it blank.' });
        quantity = null;
      }
      if (!item) {
        errors.push({ field: row.querySelector('.ing-item'), message: 'What is this ingredient?' });
        return;
      }
      var ing = { item: item, quantity: quantity, unit: unit };
      if (note) ing.note = note;
      ingredients.push(ing);
    });
    if (!ingredients.length) errors.push({ field: 'f-title', error: 'err-ingredients' });

    var instructions = [];
    var steps = byId('instruction-rows').querySelectorAll('.step-text');
    Array.prototype.forEach.call(steps, function (step) {
      var text = step.value.trim();
      if (text) instructions.push(text);
    });
    if (!instructions.length) errors.push({ field: 'f-title', error: 'err-instructions' });

    var recipe = {
      id: state.editingId || S.uniqueId(title || 'recipe', state.takenIds),
      title: title,
      description: byId('f-description').value.trim(),
      category: byId('f-category').value,
      mealType: byId('f-mealtype').value,
      difficulty: byId('f-difficulty').value,
      prepTime: byId('f-prep').value.trim(),
      cookTime: byId('f-cook').value.trim(),
      totalTime: byId('f-total').value.trim(),
      servings: byId('f-servings').value.trim(),
      estimatedCost: byId('f-cost').value.trim(),
      budgetFriendly: byId('f-budget').checked,
      freezerFriendly: byId('f-freezer').checked,
      image: null,
      ingredients: ingredients,
      instructions: instructions,
      tags: splitTags(byId('f-tags').value),
      seasons: ['all'],
      whyWeChoseThis: splitLines(byId('f-why').value),
      notes: splitLines(byId('f-notes').value),
      leftovers: byId('f-leftovers').value.trim(),
      storage: byId('f-storage').value.trim(),
      protein: byId('f-protein').value,
      cuisine: byId('f-cuisine').value,
      budgetTier: byId('f-tier').value,
      cookingMethod: byId('f-method').value,
      origin: byId('f-origin').value,
      status: byId('f-status').value,
      version: byId('f-version').value.trim() || '1.0',
      lastUpdated: new Date().toISOString().slice(0, 10),
      familyRating: Number(byId('f-rating').value),
      mamawApproved: byId('f-mamaw').checked,
      familyFavorite: byId('f-favorite').checked,
      greatLeftovers: byId('f-leftovers-flag').checked,
      papawEasy: byId('f-easy').checked,
      featured: byId('f-featured').checked,
      approvedProducts: [],
      dateAdded: state.dateAdded || new Date().toISOString().slice(0, 10)
    };

    CARRY_FIELDS.forEach(function (key) {
      if (state.carry[key] !== undefined) recipe[key] = state.carry[key];
    });

    return { recipe: recipe, errors: errors };
  }

  /* ---- Validation messages ---------------------------------------------- */

  function clearErrors() {
    R.clear(byId('form-messages'));
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (n) {
      n.removeAttribute('aria-invalid');
    });
    Array.prototype.forEach.call(form.querySelectorAll('.field-error'), function (n) {
      if (n.id.indexOf('err-') === 0) n.hidden = true;
    });
    Array.prototype.forEach.call(form.querySelectorAll('.field-error.row-error'), function (n) {
      n.remove();
    });
  }

  function showErrors(errors) {
    var box = R.el('div', 'form-alert');
    box.setAttribute('role', 'alert');
    box.appendChild(R.el('p', null, 'Almost there — a couple of things need attention:'));
    var list = R.el('ul', null);

    var firstField = null;
    errors.forEach(function (e) {
      var field = typeof e.field === 'string' ? byId(e.field) : e.field;
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        if (!firstField) firstField = field;
      }
      if (e.error) {
        var known = byId(e.error);
        known.hidden = false;
        list.appendChild(R.el('li', null, known.textContent));
      } else if (e.message) {
        list.appendChild(R.el('li', null, e.message));
        var rowError = R.el('p', 'field-error row-error', e.message);
        if (field && field.parentNode) field.parentNode.insertBefore(rowError, field.nextSibling);
      }
    });

    box.appendChild(list);
    byId('form-messages').appendChild(box);
    if (firstField) firstField.focus();
  }

  /* Validate + collect in one step; returns the recipe or null. */
  function validated() {
    clearErrors();
    R.clear(byId('save-status'));
    var result = collect();
    if (result.errors.length) {
      showErrors(result.errors);
      return null;
    }
    return result.recipe;
  }

  /* ---- Preview ----------------------------------------------------------- */

  /* Built from the same shared pieces as the real recipe page, so the
     preview IS how the recipe will look. */
  function renderPreview(recipe) {
    var box = byId('preview');
    R.clear(box);

    var article = R.el('article', null);
    article.appendChild(R.el('h3', 'preview-title', recipe.title));
    if (recipe.description) article.appendChild(R.el('p', 'lead', recipe.description));
    if (recipe.familyRating) article.appendChild(R.stars(recipe.familyRating));
    var badges = R.recipeBadges(recipe);
    if (badges.length) article.appendChild(R.badgeRow(badges));
    article.appendChild(R.metaGrid(recipe));

    if (recipe.whyWeChoseThis.length) {
      article.appendChild(R.el('h4', null, 'Why We Chose This'));
      var whyList = R.el('ul', 'why-list');
      recipe.whyWeChoseThis.forEach(function (w) { whyList.appendChild(R.el('li', null, w)); });
      article.appendChild(whyList);
    }

    article.appendChild(R.el('h4', null, 'Ingredients'));
    article.appendChild(R.ingredientsList(recipe));
    article.appendChild(R.el('h4', null, 'Instructions'));
    article.appendChild(R.instructionsList(recipe));

    if (recipe.notes.length) {
      article.appendChild(R.el('h4', null, 'Kitchen notes'));
      var notes = R.el('ul', null);
      recipe.notes.forEach(function (n) { notes.appendChild(R.el('li', null, n)); });
      article.appendChild(notes);
    }
    if (recipe.leftovers || recipe.storage) {
      article.appendChild(R.el('h4', null, 'Leftovers & storage'));
      if (recipe.leftovers) article.appendChild(R.el('p', null, recipe.leftovers));
      if (recipe.storage) article.appendChild(R.el('p', null, recipe.storage));
    }

    box.appendChild(article);
    byId('preview-area').hidden = false;
    byId('preview-area').scrollIntoView({ block: 'nearest' });
  }

  /* ---- Save, download, edit, delete -------------------------------------- */

  function showStatus(nodes) {
    var status = byId('save-status');
    R.clear(status);
    var box = R.el('div', 'notice save-notice');
    nodes.forEach(function (n) { box.appendChild(n); });
    status.appendChild(box);
  }

  function save() {
    var recipe = validated();
    if (!recipe) return;

    S.save(recipe);
    state.editingId = recipe.id;
    state.dateAdded = recipe.dateAdded;
    state.takenIds[recipe.id] = true;

    /* The URL now edits this recipe, so refreshing doesn't lose the session */
    if (window.history.replaceState) {
      window.history.replaceState(null, '', 'new-recipe.html?id=' + encodeURIComponent(recipe.id));
    }
    byId('form-title').textContent = 'Edit Recipe';
    document.title = 'Edit Recipe — Papaw’s Kitchen';

    var line = R.el('p', null, '');
    line.appendChild(R.el('strong', null, 'Saved! '));
    line.appendChild(document.createTextNode('“' + recipe.title + '” is in the recipe box on this device. '));
    line.appendChild(R.recipeLink(recipe.id, 'See the recipe page'));
    line.appendChild(document.createTextNode('.'));
    showStatus([line]);
    renderLocalList();

    if (!S.available) {
      showStatus([
        R.el('p', null, 'Saved for this visit only — this browser is blocking storage (private browsing?). Use “Download Recipe File” to keep a copy.')
      ]);
    }
  }

  function download() {
    var recipe = validated();
    if (!recipe) return;

    /* Exported file must not carry the device-only flag */
    var clean = JSON.parse(JSON.stringify(recipe));
    delete clean.local;

    var blob = new Blob([JSON.stringify(clean, null, 2) + '\n'], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = clean.id + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showStatus([R.el('p', null,
      'Downloaded “' + clean.id + '.json”. Send it to the family webmaster to add “' +
      clean.title + '” to the cookbook for everyone.')]);
  }

  function fillForm(recipe) {
    byId('f-title').value = recipe.title || '';
    byId('f-description').value = recipe.description || '';
    if (recipe.category) byId('f-category').value = recipe.category;
    if (byId('f-category').value !== recipe.category) byId('f-category').value = 'other';
    if (recipe.difficulty) byId('f-difficulty').value = recipe.difficulty;
    if (recipe.mealType) byId('f-mealtype').value = recipe.mealType;
    byId('f-prep').value = recipe.prepTime || '';
    byId('f-cook').value = recipe.cookTime || '';
    byId('f-total').value = recipe.totalTime || '';
    byId('f-servings').value = recipe.servings || '';
    byId('f-cost').value = recipe.estimatedCost || '';
    byId('f-budget').checked = !!recipe.budgetFriendly;
    byId('f-freezer').checked = !!recipe.freezerFriendly;
    byId('f-tags').value = (recipe.tags || []).join(', ');
    byId('f-why').value = (recipe.whyWeChoseThis || []).join('\n');
    byId('f-notes').value = (recipe.notes || []).join('\n');
    byId('f-leftovers').value = recipe.leftovers || '';
    byId('f-storage').value = recipe.storage || '';
    if (recipe.protein) byId('f-protein').value = recipe.protein;
    if (recipe.cuisine) byId('f-cuisine').value = recipe.cuisine;
    if (recipe.budgetTier) byId('f-tier').value = recipe.budgetTier;
    if (recipe.cookingMethod) byId('f-method').value = recipe.cookingMethod;
    if (recipe.origin) byId('f-origin').value = recipe.origin;
    if (recipe.status) byId('f-status').value = recipe.status;
    byId('f-version').value = recipe.version || '1.0';
    byId('f-rating').value = String(recipe.familyRating || 5);
    byId('f-mamaw').checked = !!recipe.mamawApproved;
    byId('f-favorite').checked = !!recipe.familyFavorite;
    byId('f-leftovers-flag').checked = !!recipe.greatLeftovers;
    byId('f-easy').checked = !!recipe.papawEasy;
    byId('f-featured').checked = !!recipe.featured;

    R.clear(byId('ingredient-rows'));
    (recipe.ingredients && recipe.ingredients.length ? recipe.ingredients : [{}])
      .forEach(addIngredient);
    R.clear(byId('instruction-rows'));
    (recipe.instructions && recipe.instructions.length ? recipe.instructions : [''])
      .forEach(addInstruction);
  }

  function startEditing(recipe, isLocal) {
    state.editingId = recipe.id;
    state.dateAdded = recipe.dateAdded || null;
    state.carry = {};
    CARRY_FIELDS.forEach(function (key) {
      if (recipe[key] !== undefined && recipe[key] !== null) state.carry[key] = recipe[key];
    });
    fillForm(recipe);
    byId('form-title').textContent = 'Edit Recipe';
    document.title = 'Edit Recipe — Papaw’s Kitchen';

    if (!isLocal) {
      showStatus([R.el('p', null,
        'You’re editing a copy of a cookbook recipe. Saving keeps your version on this device; ' +
        'the family cookbook stays as it is until your copy is downloaded and added.')]);
    }
  }

  function renderLocalList() {
    var wrap = byId('local-recipes');
    var list = byId('local-list');
    var recipes = S.list().sort(function (a, b) { return a.title < b.title ? -1 : 1; });

    R.clear(list);
    wrap.hidden = !recipes.length;

    recipes.forEach(function (recipe) {
      var li = R.el('li', null);
      var name = R.el('span', 'local-name');
      name.appendChild(R.recipeLink(recipe.id, recipe.title));
      li.appendChild(name);

      var actions = R.el('span', 'local-actions');
      actions.appendChild(R.link('Edit', 'new-recipe.html?id=' + encodeURIComponent(recipe.id), 'button button-secondary button-small'));

      var del = R.el('button', 'button button-secondary button-small', 'Delete');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (window.confirm('Delete “' + recipe.title + '” from this device? This can’t be undone.')) {
          S.remove(recipe.id);
          renderLocalList();
          if (state.editingId === recipe.id) state.editingId = null;
          showStatus([R.el('p', null, '“' + recipe.title + '” was removed from this device.')]);
        }
      });
      actions.appendChild(del);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  /* ---- Wire up ------------------------------------------------------------ */

  byId('add-ingredient').addEventListener('click', function () {
    addIngredient();
    var rows = byId('ingredient-rows').querySelectorAll('.ing-qty');
    rows[rows.length - 1].focus();
  });
  byId('add-instruction').addEventListener('click', function () {
    addInstruction();
    var rows = byId('instruction-rows').querySelectorAll('.step-text');
    rows[rows.length - 1].focus();
  });
  byId('btn-preview').addEventListener('click', function () {
    var recipe = validated();
    if (recipe) renderPreview(recipe);
  });
  byId('btn-save').addEventListener('click', save);
  byId('btn-download').addEventListener('click', download);
  form.addEventListener('submit', function (e) { e.preventDefault(); save(); });

  /* Start: learn taken ids, then either edit ?id=... or begin fresh */
  PapawData.getRecipeIndex()
    .then(function (index) {
      index.recipes.forEach(function (r) { state.takenIds[r.id] = true; });
    })
    .catch(function () { /* new ids just can't dodge cookbook ids offline */ })
    .then(function () {
      var id = new URLSearchParams(window.location.search).get('id');
      if (!id) {
        addIngredient();
        addInstruction();
        renderLocalList();
        return;
      }
      var local = S.get(id);
      if (local) {
        startEditing(local, true);
        renderLocalList();
        return;
      }
      return PapawData.getRecipe(id)
        .then(function (recipe) { startEditing(recipe, false); })
        .catch(function () {
          addIngredient();
          addInstruction();
          showStatus([R.el('p', null, 'We couldn’t find that recipe to edit, so this is a fresh card.')]);
        })
        .then(renderLocalList);
    });
})();
