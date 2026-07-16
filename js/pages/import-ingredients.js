/* Import Submission (admin): read a submission file, review each ingredient
   with its photo, approve or reject individually, then add the approved ones
   to the device library and download the updated library to commit. */

(function () {
  'use strict';

  var R = PapawRender;
  var I = PapawIngredients;
  var fileInput = document.getElementById('submission-file');
  if (!fileInput) return;

  var byId = function (id) { return document.getElementById(id); };
  var state = {
    submission: null,
    decisions: [],     /* 'approve' | 'reject' per ingredient, index-aligned */
    library: []        /* current merged library, for unique ids on approval */
  };

  function loadLibrary() {
    return I.getLibrary().then(function (list) { state.library = list; });
  }

  function approvedCount() {
    return state.decisions.filter(function (d) { return d === 'approve'; }).length;
  }

  function updateApplyButton() {
    var apply = byId('btn-apply');
    if (!apply) return;
    var n = approvedCount();
    apply.textContent = 'Add ' + n + ' Approved to Library';
    apply.disabled = n === 0;
  }

  /* ---- Review list ------------------------------------------------------- */

  function reviewRow(ing, index) {
    var li = R.el('li', 'review-row');
    li.appendChild(R.ingredientMedia(ing));

    var info = R.el('div', 'submission-info');
    info.appendChild(R.el('span', 'submission-name', ing.name || '(no name)'));
    var meta = [ing.category, ing.createdBy ? 'from ' + ing.createdBy : null]
      .filter(Boolean).join(' · ');
    if (meta) info.appendChild(R.el('span', 'card-meta', meta));
    if (ing.notes) info.appendChild(R.el('span', 'card-meta', ing.notes));
    li.appendChild(info);

    var controls = R.el('div', 'review-controls');
    var approve = R.el('button', 'decision-btn approve-btn', 'Approve');
    var reject = R.el('button', 'decision-btn reject-btn', 'Reject');
    approve.type = 'button';
    reject.type = 'button';

    function paint() {
      var d = state.decisions[index];
      approve.setAttribute('aria-pressed', String(d === 'approve'));
      reject.setAttribute('aria-pressed', String(d === 'reject'));
      li.classList.toggle('is-rejected', d === 'reject');
      updateApplyButton();
    }
    approve.addEventListener('click', function () { state.decisions[index] = 'approve'; paint(); });
    reject.addEventListener('click', function () { state.decisions[index] = 'reject'; paint(); });

    controls.appendChild(approve);
    controls.appendChild(reject);
    li.appendChild(controls);
    paint();
    return li;
  }

  function renderReview() {
    var wrap = byId('review-area');
    R.clear(wrap);
    var sub = state.submission;
    if (!sub) { wrap.hidden = true; return; }
    wrap.hidden = false;

    var count = sub.ingredients.length;
    wrap.appendChild(R.el('h2', null, 'Review submission'));
    wrap.appendChild(R.el('p', 'lead',
      'From ' + (sub.submittedBy || 'someone') +
      (sub.submittedDate ? ' · ' + R.formatDate(sub.submittedDate) : '') +
      ' · ' + count + ' ingredient' + (count === 1 ? '' : 's')));

    var list = R.el('ul', 'review-list');
    sub.ingredients.forEach(function (ing, i) {
      list.appendChild(reviewRow(ing, i));
    });
    wrap.appendChild(list);

    var apply = R.el('button', 'button', '');
    apply.type = 'button';
    apply.id = 'btn-apply';
    apply.addEventListener('click', applyDecisions);
    wrap.appendChild(apply);

    var result = R.el('div', null);
    result.id = 'apply-result';
    wrap.appendChild(result);

    updateApplyButton();
  }

  /* ---- Applying decisions ------------------------------------------------ */

  function applyDecisions() {
    var added = [];
    state.submission.ingredients.forEach(function (ing, i) {
      if (state.decisions[i] === 'approve') {
        added.push(I.addApproved(ing, state.library.concat(added)));
      }
    });
    state.library = state.library.concat(added);

    var result = byId('apply-result');
    R.clear(result);
    var box = R.el('div', 'notice save-notice');
    box.appendChild(R.el('p', null,
      added.length + ' ingredient' + (added.length === 1 ? '' : 's') +
      ' added to the library on this device. Download the library file and commit it to share with everyone.'));

    var download = R.el('button', 'button', 'Download Library File');
    download.type = 'button';
    download.addEventListener('click', downloadLibrary);
    box.appendChild(download);

    var browse = R.el('p', null, '');
    browse.appendChild(R.link('See the ingredient library', 'ingredients.html'));
    box.appendChild(browse);

    result.appendChild(box);
    byId('btn-apply').disabled = true;
  }

  function downloadLibrary() {
    I.getLibrary().then(function (list) {
      var data = I.buildLibraryExport(list);
      var blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'index.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  /* ---- Choosing a file --------------------------------------------------- */

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    var status = byId('import-status');
    R.clear(status);
    if (!file) return;

    var reader = new FileReader();
    reader.onerror = function () {
      status.appendChild(R.notice('That file couldn’t be read.', 'Please try choosing it again.'));
    };
    reader.onload = function () {
      try {
        state.submission = I.parseSubmission(reader.result);
        state.decisions = state.submission.ingredients.map(function () { return 'approve'; });
        renderReview();
      } catch (err) {
        state.submission = null;
        renderReview();
        status.appendChild(R.notice('That file couldn’t be imported.',
          err.message || 'Please check the file and try again.'));
      }
    };
    reader.readAsText(file);
  });

  loadLibrary();
})();
