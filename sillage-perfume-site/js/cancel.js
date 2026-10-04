(function(){
  const mode = localStorage.getItem('sillage_mode') || 'random';
  const selectedId = localStorage.getItem('sillage_selection');
  const container = document.getElementById('summary-item');
  const priceLabel = document.getElementById('price-label');
  const priceValue = document.getElementById('price-value');

  let pool;
  try {
    pool = JSON.parse(localStorage.getItem('sillage_pool'));
  } catch (e) { pool = null; }
  if (!Array.isArray(pool) || pool.length === 0) {
    pool = FRAGRANCES.map(f => f.id);
  }

  if (mode === 'chosen' && selectedId) {
    const f = FRAGRANCES.find(x => x.id === selectedId);
    if (f) {
      container.innerHTML = `
        <div class="glass-wrap" style="width:64px;height:80px;display:flex;align-items:center;justify-content:center;background:var(--paper);border-radius:0;">
          <img src="${f.img}" alt="${f.name} bottle" style="height:100%;width:auto;object-fit:contain;">
        </div>
        <div>
          <p class="fam">${f.family}</p>
          <h3>${f.name}</h3>
          <p style="font-size:13.5px;color:#5a5a5a;margin-top:4px;">Choose my own — ships monthly</p>
        </div>`;
      priceLabel.textContent = 'Subscription';
      priceValue.textContent = `$${formatPrice(f.price)}`;
    }
  } else {
    const avg = averagePrice(pool);
    container.innerHTML = `
      <div class="glass-wrap">${mysteryVialSVG(46)}</div>
      <div>
        <p class="fam">Surprise me</p>
        <h3>Mystery bottle</h3>
        <p style="font-size:13.5px;color:#5a5a5a;margin-top:4px;">${pool.length}-fragrance rotation</p>
      </div>`;
    priceLabel.textContent = 'Subscription (avg. of rotation)';
    priceValue.textContent = `$${formatPrice(avg)}`;
  }

  const stepInitial = document.getElementById('cancel-step-initial');
  const stepConfirm = document.getElementById('cancel-step-confirm');
  const stepDone = document.getElementById('cancel-step-done');

  document.getElementById('start-cancel').addEventListener('click', () => {
    stepInitial.style.display = 'none';
    stepConfirm.style.display = 'block';
  });

  document.getElementById('keep-sub').addEventListener('click', () => {
    stepConfirm.style.display = 'none';
    stepInitial.style.display = 'block';
  });

  document.getElementById('confirm-cancel').addEventListener('click', () => {
    stepConfirm.style.display = 'none';
    stepDone.style.display = 'block';
  });
})();
