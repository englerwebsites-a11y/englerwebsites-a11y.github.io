(function(){
  const mode = localStorage.getItem('sillage_mode') || 'random';
  const selectedId = localStorage.getItem('sillage_selection');
  const container = document.getElementById('summary-item');
  const priceLabel = document.getElementById('price-label');
  const priceValue = document.getElementById('price-value');
  const priceTotal = document.getElementById('price-total');

  let pool;
  try {
    pool = JSON.parse(localStorage.getItem('sillage_pool'));
  } catch (e) { pool = null; }
  if (!Array.isArray(pool) || pool.length === 0) {
    pool = FRAGRANCES.map(f => f.id);
  }

  function setPrice(amount, label){
    priceLabel.textContent = label;
    priceValue.textContent = `$${formatPrice(amount)}`;
    priceTotal.textContent = `$${formatPrice(amount)}`;
  }

  if (mode === 'chosen' && selectedId) {
    const f = FRAGRANCES.find(x => x.id === selectedId);
    if (f) {
      container.innerHTML = `
        <div class="glass-wrap" style="width:64px;height:80px;display:flex;align-items:center;justify-content:center;background:var(--paper);border-radius:2px;">
          <img src="${f.img}" alt="${f.name} bottle" style="height:100%;width:auto;object-fit:contain;">
        </div>
        <div>
          <p class="fam">${f.family}</p>
          <h3>${f.name}</h3>
          <p style="font-size:13.5px;color:var(--ink);opacity:0.65;margin-top:4px;">Your choice — ships monthly</p>
        </div>`;
      setPrice(f.price, 'Subscription');
      return;
    }
  }

  const avg = averagePrice(pool);
  container.innerHTML = `
    <div class="glass-wrap">${mysteryVialSVG(46)}</div>
    <div>
      <p class="fam">Surprise me</p>
      <h3>Mystery bottle</h3>
      <p style="font-size:13.5px;color:var(--ink);opacity:0.65;margin-top:4px;">Picked from your ${pool.length}-fragrance rotation each month</p>
    </div>`;
  setPrice(avg, 'Subscription (avg. of rotation)');
})();
