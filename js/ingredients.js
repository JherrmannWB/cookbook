/* Papaw's Kitchen — the ingredient library and submission workflow.

   Three moving parts, all data-driven and backend-free:
   1. The master library = committed data/ingredients/index.json, merged with
      any ingredients approved on this device (localStorage), same pattern as
      the recipe box.
   2. A submission batch (localStorage) that a non-admin builds up and exports
      as one portable file — ingredients and their photos travel together as
      data URIs.
   3. Import: an admin reads a submission file, approves ingredients into the
      device library, then downloads the updated library to commit.

   The submission file is versioned (format + version) so new fields can be
   added later without breaking older importers; unknown fields are preserved
   on the way through. */

window.PapawIngredients = (function () {
  'use strict';

  var LIBRARY_KEY = 'papawsKitchen.ingredientLibrary.v1';
  var BATCH_KEY = 'papawsKitchen.ingredientSubmission.v1';
  var SUBMISSION_FORMAT = 'papaws-kitchen-ingredient-submission';
  var SUBMISSION_VERSION = 1;

  var memory = {};
  var storageWorks = (function () {
    try {
      localStorage.setItem(LIBRARY_KEY + '.test', '1');
      localStorage.removeItem(LIBRARY_KEY + '.test');
      return true;
    } catch (e) {
      return false;
    }
  })();

  function readKey(key) {
    if (!storageWorks) return (memory[key] || []).slice();
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeKey(key, arr) {
    if (!storageWorks) { memory[key] = arr; return; }
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function uid() {
    return 'i' + Date.now() + Math.random().toString(36).slice(2, 7);
  }

  function slugify(name) {
    return String(name).toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'ingredient';
  }

  function uniqueId(name, taken) {
    var base = slugify(name);
    var id = base;
    var n = 2;
    while (taken[id]) { id = base + '-' + n; n += 1; }
    return id;
  }

  /* Drop internal bookkeeping keys (_uid, pendingCommit) before export. */
  function clean(obj) {
    var out = {};
    Object.keys(obj).forEach(function (k) {
      if (k.charAt(0) === '_' || k === 'pendingCommit') return;
      out[k] = obj[k];
    });
    return out;
  }

  /* ---- Master library ---------------------------------------------------- */

  /* Committed ingredients + device-approved ones (approved win by id),
     sorted by name. */
  function getLibrary() {
    return PapawData.getIngredients()
      .catch(function () { return { ingredients: [] }; })
      .then(function (data) {
        var byId = {};
        var order = [];
        (data.ingredients || []).forEach(function (ing) {
          if (!byId[ing.id]) order.push(ing.id);
          byId[ing.id] = ing;
        });
        readKey(LIBRARY_KEY).forEach(function (ing) {
          if (!byId[ing.id]) order.push(ing.id);
          byId[ing.id] = ing;
        });
        return order.map(function (id) { return byId[id]; })
          .sort(function (a, b) {
            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
          });
      });
  }

  /* Approve one submitted ingredient into the device library. `existing` is
     the current merged library, used to give the new entry a unique id. */
  function addApproved(ingredient, existing) {
    var taken = {};
    (existing || []).forEach(function (i) { taken[i.id] = true; });
    readKey(LIBRARY_KEY).forEach(function (i) { taken[i.id] = true; });

    var entry = clean(ingredient);
    entry.id = uniqueId(entry.name || 'ingredient', taken);
    if (!entry.createdDate) entry.createdDate = today();
    entry.pendingCommit = true;    /* not yet in the shared library file */

    var local = readKey(LIBRARY_KEY);
    local.push(entry);
    writeKey(LIBRARY_KEY, local);
    return entry;
  }

  /* The data/ingredients/index.json to download and commit. */
  function buildLibraryExport(mergedList) {
    return { ingredients: (mergedList || []).map(clean) };
  }

  /* ---- Submission batch (non-admin) -------------------------------------- */

  function listBatch() {
    return readKey(BATCH_KEY);
  }

  function addToBatch(ingredient) {
    var batch = readKey(BATCH_KEY);
    ingredient._uid = uid();
    batch.push(ingredient);
    writeKey(BATCH_KEY, batch);
    return ingredient;
  }

  function removeFromBatch(theUid) {
    writeKey(BATCH_KEY, readKey(BATCH_KEY).filter(function (i) {
      return i._uid !== theUid;
    }));
  }

  function clearBatch() {
    writeKey(BATCH_KEY, []);
  }

  /* The portable file: envelope + cleaned ingredients (photos included). */
  function buildSubmission(submittedBy) {
    return {
      format: SUBMISSION_FORMAT,
      version: SUBMISSION_VERSION,
      submittedBy: submittedBy || 'Papaw',
      submittedDate: today(),
      ingredients: listBatch().map(clean)
    };
  }

  /* Parse + validate an imported file. Throws a friendly Error on anything
     that isn't one of our submission files. Forward-compatible: a newer
     version still imports, and unknown fields ride along untouched. */
  function parseSubmission(text) {
    var data = JSON.parse(text);
    if (!data || data.format !== SUBMISSION_FORMAT) {
      throw new Error('That doesn’t look like a Papaw’s Kitchen ingredient submission file.');
    }
    if (!Array.isArray(data.ingredients) || !data.ingredients.length) {
      throw new Error('This submission file doesn’t have any ingredients in it.');
    }
    return data;
  }

  return {
    available: storageWorks,
    getLibrary: getLibrary,
    addApproved: addApproved,
    buildLibraryExport: buildLibraryExport,
    listBatch: listBatch,
    addToBatch: addToBatch,
    removeFromBatch: removeFromBatch,
    clearBatch: clearBatch,
    buildSubmission: buildSubmission,
    parseSubmission: parseSubmission
  };
})();
