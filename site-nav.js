// Adds a phone menu button to the Engler header. All links come from the existing header,
// so adding or renaming a page in the header updates the phone menu automatically.
(function(){
  var nav = document.querySelector('header nav');
  var links = nav && nav.querySelector('.nav-links');
  if (!links) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-toggle';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mobileMenu');
  btn.setAttribute('aria-label', 'Open menu');
  btn.innerHTML =
    '<svg class="ic-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
    '<svg class="ic-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'mobileMenu';
  var here = location.pathname.split('/').pop().replace(/\.html$/, '') || 'home';
  links.querySelectorAll('a').forEach(function(a){
    var item = document.createElement('a');
    item.href = a.getAttribute('href');
    item.textContent = a.textContent.trim();
    var target = (a.getAttribute('href') || '').split('/').pop().replace(/\.html$/, '');
    if (target === here) item.setAttribute('aria-current', 'page');
    menu.appendChild(item);
  });

  links.after(btn);
  nav.appendChild(menu);

  function setOpen(open){
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  btn.addEventListener('click', function(){ setOpen(!menu.classList.contains('open')); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); btn.focus(); } });
  document.addEventListener('click', function(e){ if (menu.classList.contains('open') && !nav.contains(e.target)) setOpen(false); });
  window.addEventListener('resize', function(){ if (window.innerWidth > 720) setOpen(false); });
})();
