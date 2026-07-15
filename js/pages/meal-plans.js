/* Meal Plans page: renders the rotating weeks from data/meal-plans/.
   ?week=week-02 selects a week; the first week in the index is the default.
   Meals reference recipes by id only — titles come from the recipe index,
   so recipe details are never duplicated into a meal plan. */

(function () {
  'use strict';

  var R = PapawRender;
  var container = document.getElementById('meal-plan-container');
  if (!container) return;

  /* Large tappable buttons for choosing a week. Plain links (not JS state),
     so each week has a shareable, bookmarkable address. */
  function weekPicker(weeks, activeId) {
    var nav = R.el('nav', 'no-print');
    nav.setAttribute('aria-label', 'Choose a week');
    var list = R.el('ul', 'week-picker');
    weeks.forEach(function (week) {
      var li = R.el('li', null);
      var link = R.el('a', null, week.title);
      link.href = 'meal-plans.html?week=' + encodeURIComponent(week.id);
      if (week.id === activeId) link.setAttribute('aria-current', 'page');
      li.appendChild(link);
      list.appendChild(li);
    });
    nav.appendChild(list);
    return nav;
  }

  /* A meal is either {recipeId} (linked, title from the recipe index),
     or {text} (plain entry like "Leftovers"). Either may add a note. */
  function mealContent(meal, recipesById) {
    var wrap = R.el('span', 'day-meal');
    if (meal.recipeId) {
      var summary = recipesById[meal.recipeId];
      var link = R.el('a', null, summary ? summary.title : meal.recipeId);
      link.href = 'recipe.html?id=' + encodeURIComponent(meal.recipeId);
      wrap.appendChild(link);
    } else {
      wrap.appendChild(document.createTextNode(meal.text || '—'));
    }
    if (meal.note) wrap.appendChild(R.el('span', 'day-note', ' — ' + meal.note));
    return wrap;
  }

  function daySchedule(title, meals, recipesById) {
    var wrap = R.el('section', 'content-section');
    wrap.appendChild(R.el('h2', null, title));
    var list = R.el('ul', 'day-list');
    meals.forEach(function (meal) {
      var li = R.el('li', null);
      li.appendChild(R.el('span', 'day-name', meal.day));
      li.appendChild(mealContent(meal, recipesById));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function groceryList(groups) {
    var wrap = R.el('section', 'content-section');
    wrap.appendChild(R.el('h2', null, 'Grocery List'));
    groups.forEach(function (group) {
      var block = R.el('div', 'grocery-group');
      block.appendChild(R.el('h3', null, group.section));
      var list = R.el('ul', null);
      group.items.forEach(function (item) {
        list.appendChild(R.el('li', null, item));
      });
      block.appendChild(list);
      wrap.appendChild(block);
    });
    return wrap;
  }

  function renderWeek(week, weeks, recipesById) {
    R.clear(container);
    container.appendChild(weekPicker(weeks, week.id));

    var heading = R.el('section', 'content-section');
    heading.appendChild(R.el('h2', null, week.title));
    if (week.budget) heading.appendChild(R.el('p', 'card-meta', 'Grocery budget: ' + week.budget));
    if (week.notes) heading.appendChild(R.el('p', null, week.notes));
    container.appendChild(heading);

    if (week.sundayPrep && week.sundayPrep.length) {
      var prep = R.el('section', 'content-section');
      prep.appendChild(R.el('h2', null, 'Sunday Prep'));
      var prepList = R.el('ul', null);
      week.sundayPrep.forEach(function (task) {
        prepList.appendChild(R.el('li', null, task));
      });
      prep.appendChild(prepList);
      container.appendChild(prep);
    }

    if (week.lunches && week.lunches.length) {
      container.appendChild(daySchedule('Lunches', week.lunches, recipesById));
    }
    if (week.dinners && week.dinners.length) {
      container.appendChild(daySchedule('Dinners', week.dinners, recipesById));
    }
    if (week.groceryList && week.groceryList.length) {
      container.appendChild(groceryList(week.groceryList));
    }
  }

  Promise.all([PapawData.getMealPlanIndex(), PapawData.getRecipeIndex()])
    .then(function (results) {
      var weeks = results[0].weeks;
      var recipesById = R.recipeLookup(results[1]);
      if (!weeks.length) {
        R.clear(container);
        container.appendChild(R.notice('No meal plans yet.', 'The first week is being planned now.'));
        return;
      }

      var requested = new URLSearchParams(window.location.search).get('week');
      var known = weeks.some(function (w) { return w.id === requested; });
      /* Default to the week that's active in the rotation right now. */
      var weekId = known
        ? requested
        : (PapawSchedule.currentWeekId(results[0], new Date()) || weeks[0].id);

      return PapawData.getMealPlan(weekId).then(function (week) {
        renderWeek(week, weeks, recipesById);
      });
    })
    .catch(function () {
      R.showError(container, 'The meal plans could not be loaded. Please refresh the page.');
    });
})();
