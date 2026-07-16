/* Papaw's Kitchen — image helper.
   Turns a photo chosen from the device into a self-contained data URI that
   can travel inside a JSON file (no separate image files to lose).
   Photos are scaled down to a bounded size: big enough that a future AI
   could recognize the ingredient, small enough that a batch of them fits in
   the browser's storage and in an email-able submission file. */

window.PapawImage = (function () {
  'use strict';

  var MAX_EDGE = 1600;   /* longest side, in pixels */
  var QUALITY = 0.85;    /* JPEG quality */

  /* fromFile(file) -> Promise<dataURI string>.
     Rejects with a friendly Error for non-images or unreadable files. */
  function fromFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error('No photo was chosen.'));
        return;
      }
      if (file.type && file.type.indexOf('image/') !== 0) {
        reject(new Error('Please choose an image file (a photo).'));
        return;
      }

      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('That photo couldn’t be read.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('That photo couldn’t be opened.')); };
        img.onload = function () {
          var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));

          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          /* White base so photos saved from transparent PNGs don't go black */
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          try {
            resolve(canvas.toDataURL('image/jpeg', QUALITY));
          } catch (e) {
            reject(new Error('That photo couldn’t be processed.'));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  return { fromFile: fromFile, MAX_EDGE: MAX_EDGE };
})();
