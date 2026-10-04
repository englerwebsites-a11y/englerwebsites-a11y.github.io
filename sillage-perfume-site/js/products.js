(function(){
  const grid = document.getElementById('product-grid');
  const modeRandomBtn = document.getElementById('mode-random');
  const modeChosenBtn = document.getElementById('mode-chosen');
  const caption = document.getElementById('mode-caption');
  const mysteryBanner = document.getElementById('mystery-banner');
  const mysteryHeading = document.getElementById('mystery-heading');
  const mysteryGlass = document.getElementById('mystery-glass');
  const selSummary = document.getElementById('sel-summary');

  const ALL_IDS = FRAGRANCES.map(f => f.id);

  let mode = localStorage.getItem('sillage_mode') || 'random';
  let selectedId = localStorage.getItem('sillage_selection') || null;

  let pool;
  try {
    pool = JSON.parse(localStorage.getItem('sillage_pool'));
  } catch (e) { pool = null; }
  if (!Array.isArray(pool) || pool.length === 0) {
    pool = ALL_IDS.slice();
  }

  mysteryGlass.innerHTML = mysteryVialSVG(48);

  function savePool(){
    localStorage.setItem('sillage_pool', JSON.stringify(pool));
  }

  function renderGrid(){
    grid.innerHTML = FRAGRANCES.map((f, i) => {
      const classes = ['product-card'];
      let flagText = '';

      if (mode === 'chosen') {
        if (selectedId === f.id) { classes.push('selected'); flagText = 'Selected'; }
      } else {
        const included = pool.includes(f.id);
        if (included) { classes.push('in-pool'); flagText = 'In rotation'; }
        else { classes.push('excluded'); }
      }

      const idx = String(i + 1).padStart(2, '0');

      return `
        <div class="${classes.join(' ')}" data-id="${f.id}">
          <span class="pick-flag">${flagText}</span>
          <p class="idx">${idx}</p>
          <div class="product-photo"><img src="${f.img}" alt="${f.name} bottle" loading="lazy"></div>
          <p class="fam">${f.family}</p>
          <h3>${f.name}</h3>
          <p class="notes">${f.notes}</p>
          <p class="price">$${f.price}</p>
        </div>`;
    }).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (mode === 'chosen') {
          selectedId = id;
          localStorage.setItem('sillage_selection', selectedId);
        } else {
          if (pool.includes(id)) {
            if (pool.length === 1) return;
            pool = pool.filter(p => p !== id);
          } else {
            pool = pool.concat([id]);
          }
          savePool();
        }
        renderGrid();
        updateSummary();
      });
    });
  }

  function updateMode(next){
    mode = next;
    localStorage.setItem('sillage_mode', mode);

    modeRandomBtn.classList.toggle('active', mode === 'random');
    modeChosenBtn.classList.toggle('active', mode === 'chosen');

    if (mode === 'random') {
      caption.textContent = "Click any fragrance below to include or leave it out of your surprise rotation — we'll only ever send you one from that group.";
      mysteryBanner.style.display = 'flex';
    } else {
      caption.textContent = "Click a fragrance below to make it your monthly pick. You can change it any time before your next shipment.";
      mysteryBanner.style.display = 'none';
      if (!selectedId) {
        selectedId = FRAGRANCES[0].id;
        localStorage.setItem('sillage_selection', selectedId);
      }
    }
    renderGrid();
    updateSummary();
  }

  function updateSummary(){
    if (mode === 'random') {
      const avg = averagePrice(pool);
      mysteryHeading.textContent = `Your rotation: ${pool.length} of ${ALL_IDS.length} fragrances`;
      selSummary.innerHTML = `Mode: <span>Surprise me</span> — ${pool.length} of ${ALL_IDS.length} included — avg. $${formatPrice(avg)}/month`;
    } else {
      const f = FRAGRANCES.find(x => x.id === selectedId);
      selSummary.innerHTML = `Mode: <span>Choose my own</span> — ${f ? f.name : 'select a fragrance'} — $${f ? formatPrice(f.price) : '--'}/month`;
    }
  }

  modeRandomBtn.addEventListener('click', () => updateMode('random'));
  modeChosenBtn.addEventListener('click', () => updateMode('chosen'));

  updateMode(mode);
})();
