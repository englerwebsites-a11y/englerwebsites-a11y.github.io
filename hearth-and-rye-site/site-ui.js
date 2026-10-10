// Site-wide UI that must work on every page, even if Firebase or
// script.js fails to load: the fade-in on scroll and the phone menu.
(function () {
  // Tell the safety net in each page's <head> that fade-ins are handled.
  window.hrRevealReady = true;

  // Fade-in on scroll
  var els = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Phone menu toggle
  var bar = document.querySelector('header .nav');
  var toggle = document.querySelector('.nav-toggle');
  if (!bar || !toggle) return;

  function setOpen(open) {
    bar.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function () {
    setOpen(!bar.classList.contains('nav-open'));
  });

  // Close when a link is chosen, on Escape, or when widening past phone size.
  bar.querySelectorAll('nav a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bar.classList.contains('nav-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  var wide = window.matchMedia('(min-width: 861px)');
  var onWide = function () { if (wide.matches) setOpen(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);
})();
