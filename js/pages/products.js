/* Approved Products page: renders every product from
   data/approved-products/products.json, grouped by category. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('product-list');
  if (!container) return;

  function productCard(product) {
    var card = R.el('li', 'card product-card');

    /* Photo placeholder until real product photos are added. */
    var photo = R.el('div', 'product-photo');
    if (product.image) {
      var img = R.el('img', null);
      img.src = product.image;
      img.alt = product.name;
      img.loading = 'lazy';       /* below-the-fold photos load on scroll */
      img.decoding = 'async';
      photo.appendChild(img);
    } else {
      photo.appendChild(R.el('span', null, '🛒'));
      photo.setAttribute('aria-hidden', 'true');
    }
    card.appendChild(photo);

    card.appendChild(R.el('h3', null, product.name));
    if (product.store) card.appendChild(R.el('p', 'card-meta', product.store));
    if (product.notes) card.appendChild(R.el('p', null, product.notes));

    var badges = [];
    if (product.approved) badges.push(R.badge('Approved ✓', 'badge-sage'));
    if (product.favorite) badges.push(R.badge('★ Favorite', 'badge-favorite'));
    if (badges.length) card.appendChild(R.badgeRow(badges));

    return card;
  }

  /* Groups products by category, keeping the order categories first appear
     in the data file. */
  function groupByCategory(products) {
    var order = [];
    var byCategory = {};
    products.forEach(function (product) {
      var category = product.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = [];
        order.push(category);
      }
      byCategory[category].push(product);
    });
    return order.map(function (category) {
      return { category: category, products: byCategory[category] };
    });
  }

  function render(products) {
    R.clear(container);
    if (!products.length) {
      container.appendChild(R.notice('No products yet.', 'The shopping guide is being written now.'));
      return;
    }
    groupByCategory(products).forEach(function (group) {
      var wrap = R.section(group.category);
      var grid = R.el('ul', 'card-grid');
      group.products.forEach(function (product) {
        grid.appendChild(productCard(product));
      });
      wrap.appendChild(grid);
      container.appendChild(wrap);
    });
  }

  PapawData.getProducts()
    .then(function (data) {
      render(data.products);
    })
    .catch(function () {
      R.showError(container, 'The product list could not be loaded. Please refresh the page.');
    });
})();
