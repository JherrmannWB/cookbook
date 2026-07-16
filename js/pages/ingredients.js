/* Ingredients page: browse the master ingredient library.
   Each ingredient shows its photo, or its category icon as a fallback. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('ingredient-library');
  if (!container) return;

  function card(ing) {
    var li = R.el('li', 'card ingredient-card');
    li.appendChild(R.ingredientMedia(ing));
    li.appendChild(R.el('h2', null, ing.name));
    if (ing.category) li.appendChild(R.el('p', 'card-meta', ing.category));
    if (ing.notes) li.appendChild(R.el('p', null, ing.notes));

    var credit = [];
    if (ing.createdBy) credit.push('Added by ' + ing.createdBy);
    if (ing.createdDate) credit.push(R.formatDate(ing.createdDate));
    if (credit.length) li.appendChild(R.el('p', 'card-meta', credit.join(' · ')));

    if (ing.pendingCommit) {
      li.appendChild(R.badgeRow([R.badge('Saved on this device')]));
    }
    return li;
  }

  PapawIngredients.getLibrary()
    .then(function (list) {
      R.clear(container);
      if (!list.length) {
        container.appendChild(R.notice(
          'The ingredient library is empty.',
          'Submit the first ingredients and they’ll appear here.'
        ));
        return;
      }
      container.appendChild(R.el('p', 'card-meta',
        list.length + ' ingredient' + (list.length === 1 ? '' : 's') + ' in the library'));
      var grid = R.el('ul', 'card-grid');
      list.forEach(function (ing) { grid.appendChild(card(ing)); });
      container.appendChild(grid);
    })
    .catch(function () {
      R.showError(container, 'The ingredient library could not be loaded. Please refresh the page.');
    });
})();
