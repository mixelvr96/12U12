(function () {
  if (typeof window.PRELAUNCH_COMING_SOON === 'undefined' || !window.PRELAUNCH_COMING_SOON) {
    return;
  }
  var path = window.location.pathname || '';
  if (/coming-soon\.html$/i.test(path) || /\/coming-soon\/?$/i.test(path)) {
    return;
  }
  window.location.replace('coming-soon.html' + window.location.search + window.location.hash);
})();
