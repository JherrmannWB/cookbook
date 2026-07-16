/* Submit Ingredients: a non-admin (Papaw) builds a batch of new ingredients
   — name, category, optional notes, optional photo — then exports them all
   as one portable file to hand to the admin. The batch lives in localStorage
   so it survives closing the page mid-list. */

(function () {
  'use strict';

  var R = PapawRender;
  var I = PapawIngredients;
  var form = document.getElementById('ingredient-form');
  if (!form) return;

  var byId = function (id) { return document.getElementById(id); };
  var pendingImage = null;   /* processed photo for the ingredient being built */

  function submitterName() {
    return byId('f-submitter').value.trim() || 'Papaw';
  }

  /* ---- The pending batch ------------------------------------------------- */

  function renderBatch() {
    var wrap = byId('batch-list');
    var batch = I.listBatch();
    R.clear(wrap);
    byId('batch-count').textContent = batch.length;
    byId('btn-export').disabled = batch.length === 0;

    if (!batch.length) {
      wrap.appendChild(R.el('p', 'card-meta',
        'No ingredients added yet. Fill out the card above and press “Add to Batch.”'));
      return;
    }

    var list = R.el('ul', 'submission-list');
    batch.forEach(function (ing) {
      var li = R.el('li', 'submission-row');
      li.appendChild(R.ingredientMedia(ing));

      var info = R.el('div', 'submission-info');
      info.appendChild(R.el('span', 'submission-name', ing.name));
      if (ing.category) info.appendChild(R.el('span', 'card-meta', ing.category));
      if (ing.notes) info.appendChild(R.el('span', 'card-meta', ing.notes));
      li.appendChild(info);

      var remove = R.el('button', 'row-remove', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove ' + ing.name);
      remove.addEventListener('click', function () {
        I.removeFromBatch(ing._uid);
        renderBatch();
      });
      li.appendChild(remove);
      list.appendChild(li);
    });
    wrap.appendChild(list);
  }

  /* ---- Choosing a photo -------------------------------------------------- */

  byId('f-image').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    var preview = byId('image-preview');
    var status = byId('image-status');
    if (!file) {
      pendingImage = null;
      R.clear(preview);
      status.textContent = '';
      return;
    }
    status.textContent = 'Getting the photo ready…';
    PapawImage.fromFile(file)
      .then(function (dataUri) {
        pendingImage = dataUri;
        R.clear(preview);
        var img = R.el('img', null);
        img.src = dataUri;
        img.alt = 'Selected photo';
        preview.appendChild(img);
        status.textContent = 'Photo ready.';
      })
      .catch(function (err) {
        pendingImage = null;
        R.clear(preview);
        status.textContent = err.message || 'That photo couldn’t be used.';
      });
  });

  /* ---- Add to batch ------------------------------------------------------ */

  byId('btn-add').addEventListener('click', function () {
    var name = byId('f-name').value.trim();
    var error = byId('form-error');
    if (!name) {
      error.hidden = false;
      byId('f-name').setAttribute('aria-invalid', 'true');
      byId('f-name').focus();
      return;
    }
    error.hidden = true;
    byId('f-name').removeAttribute('aria-invalid');

    I.addToBatch({
      name: name,
      category: byId('f-category').value,
      notes: byId('f-notes').value.trim(),
      image: pendingImage,
      createdBy: submitterName(),
      createdDate: new Date().toISOString().slice(0, 10)
    });

    /* Clear the card for the next ingredient (keep the submitter name) */
    byId('f-name').value = '';
    byId('f-notes').value = '';
    byId('f-image').value = '';
    pendingImage = null;
    R.clear(byId('image-preview'));
    byId('image-status').textContent = '';

    renderBatch();
    byId('f-name').focus();
  });

  /* ---- Export ------------------------------------------------------------ */

  byId('btn-export').addEventListener('click', function () {
    var submission = I.buildSubmission(submitterName());
    var blob = new Blob([JSON.stringify(submission, null, 2) + '\n'], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ingredient-submission-' + submission.submittedDate + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    var status = byId('export-status');
    R.clear(status);
    var box = R.el('div', 'notice save-notice');
    var count = submission.ingredients.length;
    box.appendChild(R.el('p', null,
      'Saved a submission with ' + count + ' ingredient' + (count === 1 ? '' : 's') +
      '. Send the file to Jake to add them to the library.'));
    var clear = R.el('button', 'button button-secondary', 'Start a new batch');
    clear.type = 'button';
    clear.addEventListener('click', function () {
      I.clearBatch();
      renderBatch();
      R.clear(status);
    });
    box.appendChild(clear);
    status.appendChild(box);
  });

  renderBatch();
})();
