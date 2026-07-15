/* Cooking Basics page: renders the how-tos from data/basics.json.
   Each entry may have numbered steps (ol), bullet points (ul), and a tip. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('basics-list');
  if (!container) return;

  PapawData.getBasics()
    .then(function (data) {
      R.clear(container);
      if (!data.basics || !data.basics.length) {
        container.appendChild(R.notice('Nothing here yet.', 'The basics are being written down.'));
        return;
      }
      data.basics.forEach(function (basic) {
        var wrap = R.section(basic.title);
        if (basic.intro) wrap.appendChild(R.el('p', null, basic.intro));

        if (basic.steps && basic.steps.length) {
          var steps = R.el('ol', 'instructions');
          basic.steps.forEach(function (s) { steps.appendChild(R.el('li', null, s)); });
          wrap.appendChild(steps);
        }
        if (basic.points && basic.points.length) {
          var points = R.el('ul', 'why-list');
          basic.points.forEach(function (p) { points.appendChild(R.el('li', null, p)); });
          wrap.appendChild(points);
        }
        if (basic.tip) {
          wrap.appendChild(R.el('p', 'tip-text', '💡 ' + basic.tip));
        }
        container.appendChild(wrap);
      });
    })
    .catch(function () {
      R.showError(container, 'The basics could not be loaded. Please refresh the page.');
    });
})();
