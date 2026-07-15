/* Papaw's Kitchen — schedule helpers.
   The meal plans rotate (week-01, week-02, ...) rather than following the
   calendar. data/meal-plans/index.json holds `rotationStart` — the Monday
   the rotation began — and everything else is computed from today's date,
   so nobody ever has to update "which week is it" by hand. */

window.PapawSchedule = (function () {
  'use strict';

  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function dayName(date) {
    return DAY_NAMES[date.getDay()];
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * MS_PER_DAY);
  }

  /* Which rotating week is active on `date`? Weeks cycle in index order
     forever, starting from rotationStart. Falls back to the first week if
     rotationStart is missing or the date is before the rotation began. */
  function currentWeekId(planIndex, date) {
    var weeks = planIndex.weeks || [];
    if (!weeks.length) return null;

    var start = planIndex.rotationStart
      ? new Date(planIndex.rotationStart + 'T00:00:00')
      : null;
    if (!start || isNaN(start.getTime())) return weeks[0].id;

    var daysSince = Math.floor((date.getTime() - start.getTime()) / MS_PER_DAY);
    if (daysSince < 0) return weeks[0].id;

    return weeks[Math.floor(daysSince / 7) % weeks.length].id;
  }

  /* parseMoney('$85') -> 85; returns null when there's no number to find. */
  function parseMoney(text) {
    if (typeof text === 'number') return text;
    var match = String(text || '').match(/[0-9]+(\.[0-9]+)?/);
    return match ? Number(match[0]) : null;
  }

  function formatMoney(amount) {
    var rounded = Math.round(amount * 100) / 100;
    return '$' + (rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2));
  }

  return {
    dayName: dayName,
    addDays: addDays,
    currentWeekId: currentWeekId,
    parseMoney: parseMoney,
    formatMoney: formatMoney
  };
})();
