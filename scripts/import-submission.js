#!/usr/bin/env node
/* Publish an ingredient submission into the committed library.

   Takes a submission file exported from the site (ingredients with photos
   embedded as base64 data URIs) and:
     - assigns each ingredient a unique id,
     - writes each photo out as a real file in images/ingredients/<id>.<ext>,
     - stores just the path in data/ingredients/index.json.

   This keeps the committed repo clean (small JSON, real image files) while
   the submission file stays a single self-contained thing for phone-to-phone
   transfer. Run by whoever publishes the site — not by end users.

   Usage:
     node scripts/import-submission.js <submission.json> [--skip="Name1,Name2"]
*/

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var INDEX = path.join(ROOT, 'data', 'ingredients', 'index.json');
var IMAGE_DIR = path.join(ROOT, 'images', 'ingredients');
var SUBMISSION_FORMAT = 'papaws-kitchen-ingredient-submission';

var EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

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

function parseArgs(argv) {
  var out = { file: null, skip: [] };
  argv.slice(2).forEach(function (arg) {
    if (arg.indexOf('--skip=') === 0) {
      out.skip = arg.slice(7).split(',').map(function (s) {
        return s.trim().toLowerCase();
      }).filter(Boolean);
    } else if (!out.file) {
      out.file = arg;
    }
  });
  return out;
}

function main() {
  var args = parseArgs(process.argv);
  if (!args.file) {
    console.error('Usage: node scripts/import-submission.js <submission.json> [--skip="Name1,Name2"]');
    process.exit(1);
  }

  var submission = JSON.parse(fs.readFileSync(args.file, 'utf8'));
  if (submission.format !== SUBMISSION_FORMAT) {
    console.error('That file is not a Papaw’s Kitchen ingredient submission.');
    process.exit(1);
  }

  var library = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  var taken = {};
  library.ingredients.forEach(function (i) { taken[i.id] = true; });
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  var added = 0, skipped = 0, photos = 0;

  (submission.ingredients || []).forEach(function (ing) {
    if (args.skip.indexOf(String(ing.name || '').toLowerCase()) !== -1) {
      skipped += 1;
      return;
    }
    var id = uniqueId(ing.name || 'ingredient', taken);
    taken[id] = true;

    var entry = {
      id: id,
      name: ing.name || '',
      category: ing.category || 'Other',
      notes: ing.notes || '',
      image: null,
      createdBy: ing.createdBy || submission.submittedBy || 'Unknown',
      createdDate: ing.createdDate || new Date().toISOString().slice(0, 10)
    };

    /* Carry through any fields we don't know about (forward compatibility) */
    Object.keys(ing).forEach(function (key) {
      if (key !== 'image' && !(key in entry)) entry[key] = ing[key];
    });

    if (typeof ing.image === 'string' && ing.image.indexOf('data:') === 0) {
      var m = ing.image.match(/^data:([^;]+);base64,(.*)$/);
      if (m) {
        var ext = EXT_BY_MIME[m[1]] || 'jpg';
        var filename = id + '.' + ext;
        fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(m[2], 'base64'));
        entry.image = 'images/ingredients/' + filename;
        photos += 1;
      }
    } else if (typeof ing.image === 'string' && ing.image) {
      entry.image = ing.image;   /* already a path */
    }

    library.ingredients.push(entry);
    added += 1;
  });

  fs.writeFileSync(INDEX, JSON.stringify(library, null, 2) + '\n');

  var summary = 'Added ' + added + ' ingredient' + (added === 1 ? '' : 's');
  if (photos) summary += ', ' + photos + ' photo' + (photos === 1 ? '' : 's') + ' saved';
  if (skipped) summary += ', ' + skipped + ' skipped';
  console.log(summary + '.');
  console.log('Updated ' + path.relative(ROOT, INDEX));
}

main();
