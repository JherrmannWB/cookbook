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
    var metaBits = [product.brand, product.store, product.price].filter(Boolean)
      .filter(function (bit, i, all) { return all.indexOf(bit) === i; }); /* "Publix · Publix" -> "Publix" */
    if (metaBits.length) card.appendChild(R.el('p', 'card-meta', metaBits.join(' · ')));

    /* Same standard badges as recipes — one system everywhere */
    var badges = R.recipeBadges(product);
    if (badges.length) card.appendChild(R.badgeRow(badges));

    if (product.whyWeChoseThis && product.whyWeChoseThis.length) {
      var why = R.el('div', 'product-why');
      why.appendChild(R.el('h4', null, 'Why we chose this'));
      var whyList = R.el('ul', 'why-list');
      product.whyWeChoseThis.forEach(function (reason) {
        whyList.appendChild(R.el('li', null, reason));
      });
      why.appendChild(whyList);
      card.appendChild(why);
    }

    if (product.ingredientList && product.ingredientList.length) {
      var ing = R.el('p', 'product-detail');
      ing.appendChild(R.el('strong', null, 'What’s in it: '));
      ing.appendChild(document.createTextNode(product.ingredientList.join(', ')));
      card.appendChild(ing);
    }

    /* Never invent a health score — Jake verifies them by hand */
    var yuka = R.el('p', 'product-detail');
    yuka.appendChild(R.el('strong', null, 'Yuka score: '));
    yuka.appendChild(document.createTextNode(product.yukaScore || 'Ask Jake to verify'));
    card.appendChild(yuka);

    if (product.notes) card.appendChild(R.el('p', 'product-detail product-notes', product.notes));

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
