/* Papaw's Kitchen — shared layout.
   Injects the skip link, header/navigation, and footer into every page,
   so the site chrome is defined exactly once. */

(function () {
  'use strict';

  var NAV_PAGES = [
    { file: 'index.html', label: 'Home' },
    { file: 'meal-plans.html', label: 'Meal Plans' },
    { file: 'recipes.html', label: 'Recipes' },
    { file: 'products.html', label: 'Approved Products' },
    { file: 'shopping-lists.html', label: 'Shopping Lists' },
    { file: 'favorites.html', label: 'Family Favorites' },
    { file: 'about.html', label: 'About' }
  ];

  function currentFile() {
    var file = window.location.pathname.split('/').pop();
    return file === '' ? 'index.html' : file;
  }

  /* Individual recipe pages live under the Recipes section of the nav. */
  function isCurrent(navFile, pageFile) {
    if (navFile === pageFile) return true;
    if (navFile === 'recipes.html' && pageFile === 'recipe.html') return true;
    return false;
  }

  function buildHeader() {
    var page = currentFile();

    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main-content';
    skip.textContent = 'Skip to main content';

    var header = document.createElement('header');
    header.className = 'site-header';

    var title = document.createElement('p');
    title.className = 'site-title';
    var titleLink = document.createElement('a');
    titleLink.href = 'index.html';
    titleLink.textContent = 'Papaw’s Kitchen';
    title.appendChild(titleLink);

    var tagline = document.createElement('p');
    tagline.className = 'site-tagline';
    tagline.textContent = 'Family recipes, made with love';

    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Main menu');
    var list = document.createElement('ul');
    list.className = 'site-nav';

    NAV_PAGES.forEach(function (item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item.file;
      a.textContent = item.label;
      if (isCurrent(item.file, page)) {
        a.setAttribute('aria-current', 'page');
      }
      li.appendChild(a);
      list.appendChild(li);
    });

    nav.appendChild(list);
    header.appendChild(title);
    header.appendChild(tagline);
    header.appendChild(nav);

    document.body.insertBefore(header, document.body.firstChild);
    document.body.insertBefore(skip, header);
  }

  function buildFooter() {
    var footer = document.createElement('footer');
    footer.className = 'site-footer';

    var line1 = document.createElement('p');
    line1.textContent = 'Papaw’s Kitchen — our family cookbook.';

    var line2 = document.createElement('p');
    line2.textContent = 'Made with love, ' + new Date().getFullYear();

    footer.appendChild(line1);
    footer.appendChild(line2);
    document.body.appendChild(footer);
  }

  function addFavicon() {
    var link = document.createElement('link');
    link.rel = 'icon';
    link.href =
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
          '<text y="0.9em" font-size="90">🥣</text></svg>'
      );
    document.head.appendChild(link);
  }

  function init() {
    buildHeader();
    buildFooter();
    addFavicon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
