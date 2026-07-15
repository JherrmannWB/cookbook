/* Kitchen Tips page: every tip from data/tips.json as a friendly card.
   (The dashboard shows one of these at random each visit.) */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('tips-list');
  if (!container) return;

  PapawData.getTips()
    .then(function (data) {
      R.clear(container);
      if (!data.tips || !data.tips.length) {
        container.appendChild(R.notice('No tips yet.', 'The kitchen wisdom is still being collected.'));
        return;
      }
      var grid = R.el('ul', 'card-grid');
      data.tips.forEach(function (tip) {
        var card = R.el('li', 'card');
        card.appendChild(R.el('p', 'tip-text', '💡 ' + tip));
        grid.appendChild(card);
      });
      container.appendChild(grid);
    })
    .catch(function () {
      R.showError(container, 'The tips could not be loaded. Please refresh the page.');
    });
})();
