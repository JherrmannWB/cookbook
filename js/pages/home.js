/* Home page — the kitchen dashboard.
   Answers, at a glance: what's for dinner tonight, what the week looks
   like, what tomorrow's lunch is, and where the grocery budget stands.
   Every section is rendered from JSON data; nothing here is hardcoded. */

(function () {
  'use strict';

  var R = PapawRender;
  var S = PapawSchedule;
  var container = document.getElementById('dashboard');
  if (!container) return;

  /* Emoji stand-ins until recipes have photos, chosen by recipe category. */
  var CATEGORY_ICONS = {
    'main-dishes': '🍲',
    'sides': '🥗',
    'breads': '🥖',
    'desserts': '🍰'
  };
  var DEFAULT_ICON = '🍽️';

  function iconFor(summary) {
    return (summary && CATEGORY_ICONS[summary.category]) || DEFAULT_ICON;
  }

  function findMeal(meals, day) {
    return (meals || []).filter(function (m) { return m.day === day; })[0] || null;
  }

  function pickRandom(list) {
    return list && list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }

  /* ---- Hero: tonight's dinner ------------------------------------------ */

  function heroSection(dinner, recipe, todayName) {
    var hero = R.el('section', 'hero');
    hero.appendChild(R.el('p', 'eyebrow', 'Tonight’s dinner · ' + todayName));

    if (recipe) {
      var photo = R.el('div', 'hero-photo');
      photo.setAttribute('aria-hidden', 'true');
      photo.appendChild(R.el('span', null, iconFor(recipe)));
      hero.appendChild(photo);

      hero.appendChild(R.el('h2', null, recipe.title));
      if (dinner.note) hero.appendChild(R.el('p', 'card-meta', dinner.note));
      if (recipe.description) hero.appendChild(R.el('p', null, recipe.description));
      hero.appendChild(R.metaGrid(recipe));
      hero.appendChild(R.recipeLink(recipe.id, 'Start Cooking', 'button button-large'));
    } else if (dinner) {
      /* Plain-text plan entry: "Fish night", "Dinner at Susan's"... */
      hero.appendChild(R.el('h2', null, dinner.text));
      if (dinner.note) hero.appendChild(R.el('p', 'card-meta', dinner.note));
      hero.appendChild(R.el('p', null, 'Straight from this week’s plan — no recipe needed tonight.'));
      hero.appendChild(R.link('See the Week’s Plan', 'meal-plans.html', 'button button-large'));
    } else {
      hero.appendChild(R.el('h2', null, 'Nothing on the calendar tonight'));
      hero.appendChild(R.el('p', null, 'Pick something good from the recipe box.'));
      hero.appendChild(R.link('Browse Recipes', 'recipes.html', 'button button-large'));
    }
    return hero;
  }

  /* ---- Weekly overview: one small card per dinner ---------------------- */

  function weekOverview(week, recipesById, todayName) {
    var wrap = R.section('This Week’s Dinners');
    if (week.title) wrap.appendChild(R.el('p', 'card-meta', week.title));

    var list = R.el('ul', 'meal-week');
    (week.dinners || []).forEach(function (meal) {
      var isToday = meal.day === todayName;
      var li = R.el('li', 'meal-card' + (isToday ? ' today' : ''));
      if (isToday) li.setAttribute('aria-current', 'date');

      var dayRow = R.el('span', 'meal-day', meal.day);
      if (isToday) dayRow.appendChild(R.el('span', 'today-badge', 'Today'));
      li.appendChild(dayRow);

      var summary = meal.recipeId ? recipesById[meal.recipeId] : null;
      li.appendChild(R.el('span', 'meal-icon', meal.recipeId ? iconFor(summary) : DEFAULT_ICON))
        .setAttribute('aria-hidden', 'true');

      if (meal.recipeId) {
        li.appendChild(R.recipeLink(meal.recipeId, summary && summary.title));
        if (summary && summary.prepTime) {
          li.appendChild(R.el('p', 'card-meta', summary.prepTime + ' prep'));
        }
      } else {
        li.appendChild(R.el('span', 'meal-text', meal.text || '—'));
      }
      if (meal.note) li.appendChild(R.el('p', 'day-note', meal.note));

      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* ---- Tomorrow's lunch ------------------------------------------------ */

  function lunchCard(weekTomorrow, tomorrowName, recipesById, tips) {
    var card = R.el('div', 'card');
    card.appendChild(R.el('h2', null, 'Tomorrow’s Lunch'));
    card.appendChild(R.el('p', 'card-meta', tomorrowName));

    var lunch = weekTomorrow ? findMeal(weekTomorrow.lunches, tomorrowName) : null;

    if (lunch && lunch.recipeId) {
      var summary = recipesById[lunch.recipeId];
      var p = R.el('p', 'dashboard-answer');
      p.appendChild(R.recipeLink(lunch.recipeId, summary && summary.title));
      card.appendChild(p);
      card.appendChild(R.el('p', 'card-meta', 'Planned in this week’s meal plan.'));
    } else if (lunch && lunch.text) {
      card.appendChild(R.el('p', 'dashboard-answer', lunch.text));
      card.appendChild(R.el('p', 'card-meta', 'Planned in this week’s meal plan.'));
    } else {
      /* Nothing planned — offer an easy idea from data/tips.json. */
      var idea = pickRandom(tips.quickLunches);
      card.appendChild(R.el('p', 'dashboard-answer', idea || 'Cook’s choice!'));
      card.appendChild(R.el('p', 'card-meta', 'Nothing planned — here’s an easy idea.'));
    }
    return card;
  }

  /* ---- Budget ----------------------------------------------------------- */

  function budgetCard(week) {
    var card = R.el('div', 'card');
    card.appendChild(R.el('h2', null, 'This Week’s Budget'));

    var budget = S.parseMoney(week.budget);
    var spent = S.parseMoney(week.estimatedTotal);

    if (week.budget) card.appendChild(R.el('p', null, 'Grocery budget: ' + week.budget));
    if (week.estimatedTotal) card.appendChild(R.el('p', null, 'Estimated total: ' + week.estimatedTotal));

    if (budget !== null && spent !== null && budget > 0) {
      var remaining = Math.max(budget - spent, 0);
      var remainingLine = R.el('p', null, '');
      remainingLine.appendChild(R.el('strong', null, S.formatMoney(remaining) + ' left over'));
      card.appendChild(remainingLine);

      var percent = Math.min(Math.round((spent / budget) * 100), 100);
      var bar = R.el('div', 'progress');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(budget));
      bar.setAttribute('aria-valuenow', String(spent));
      bar.setAttribute('aria-label',
        'Estimated ' + S.formatMoney(spent) + ' spent of ' + S.formatMoney(budget) + ' budget');
      var fill = R.el('div', 'progress-fill');
      fill.style.width = percent + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
    }
    return card;
  }

  /* ---- Kitchen tip ------------------------------------------------------ */

  function tipCard(tips) {
    var card = R.el('div', 'card');
    card.appendChild(R.el('h2', null, 'Kitchen Tip'));
    var tip = pickRandom(tips.tips);
    card.appendChild(R.el('p', 'tip-text', tip ? '💡 ' + tip : 'Cook with love.'));
    return card;
  }

  /* ---- Featured recipe --------------------------------------------------- */

  function featuredSection(recipeIndex, tonightRecipe) {
    var featured = recipeIndex.recipes.filter(function (r) { return r.featured; });
    /* Prefer not to feature the same recipe that's already in the hero. */
    var pool = featured.filter(function (r) {
      return !tonightRecipe || r.id !== tonightRecipe.id;
    });
    var pick = pickRandom(pool.length ? pool : featured);
    if (!pick) return null;

    var wrap = R.section('Featured Recipe');
    var grid = R.el('ul', 'card-grid');
    grid.appendChild(R.recipeCard(pick));
    wrap.appendChild(grid);
    return wrap;
  }

  /* ---- Load everything, then render ------------------------------------ */

  Promise.all([PapawData.getMealPlanIndex(), PapawData.getRecipeIndex(), PapawData.getTips()])
    .then(function (results) {
      var planIndex = results[0];
      var recipeIndex = results[1];
      var tips = results[2];
      var recipesById = R.recipeLookup(recipeIndex);

      var now = new Date();
      var todayName = S.dayName(now);
      var tomorrow = S.addDays(now, 1);
      var tomorrowName = S.dayName(tomorrow);

      /* Tomorrow can fall in the next week of the rotation (Sunday night). */
      var weekIdToday = S.currentWeekId(planIndex, now);
      var weekIdTomorrow = S.currentWeekId(planIndex, tomorrow);
      var weekIds = weekIdTomorrow === weekIdToday ? [weekIdToday] : [weekIdToday, weekIdTomorrow];

      return Promise.all(weekIds.map(PapawData.getMealPlan)).then(function (weeks) {
        var weekToday = weeks[0];
        var weekTomorrow = weeks[weeks.length - 1];
        var dinner = findMeal(weekToday.dinners, todayName);

        /* The hero shows full recipe details, so fetch tonight's recipe;
           a missing file falls back to the plain-text hero. */
        var recipePromise = dinner && dinner.recipeId
          ? PapawData.getRecipe(dinner.recipeId).catch(function () { return null; })
          : Promise.resolve(null);

        return recipePromise.then(function (tonightRecipe) {
          R.clear(container);
          container.appendChild(heroSection(dinner, tonightRecipe, todayName));
          container.appendChild(weekOverview(weekToday, recipesById, todayName));

          var grid = R.el('div', 'dashboard-grid');
          grid.appendChild(lunchCard(weekTomorrow, tomorrowName, recipesById, tips));
          grid.appendChild(budgetCard(weekToday));
          grid.appendChild(tipCard(tips));
          container.appendChild(grid);

          var featured = featuredSection(recipeIndex, tonightRecipe);
          if (featured) container.appendChild(featured);
        });
      });
    })
    .catch(function () {
      R.showError(container, 'The kitchen dashboard could not be loaded. Please refresh the page.');
    });
})();
