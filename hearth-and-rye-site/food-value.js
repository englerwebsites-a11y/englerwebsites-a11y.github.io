// Food Value page — carousel through nutrition facts, with a search
// bar that jumps straight to a matching item.
let fvCurrentIndex = 0;

function fvRenderItem(idx) {
  const item = foodValueItems[idx];
  if (!item) return;

  document.getElementById('fvImg').src = item.img;
  document.getElementById('fvImg').alt = item.name;
  document.getElementById('fvIndex').textContent = `Item ${idx + 1} of ${foodValueItems.length}`;
  document.getElementById('fvName').textContent = item.name;
  document.getElementById('fvServing').textContent = `Serving size: ${item.serving}`;
  document.getElementById('fvCalories').textContent = item.calories;

  const rows = [
    ['Protein', item.protein + 'g'],
    ['Total Carbohydrates', item.carbs + 'g'],
    ['Total Fat', item.fat + 'g'],
    ['Dietary Fiber', item.fiber + 'g'],
    ['Total Sugars', item.sugar + 'g'],
    ['Sodium', item.sodium + 'mg'],
  ];
  if (item.caffeine) rows.push(['Caffeine', item.caffeine + 'mg']);

  const table = document.getElementById('fvNutritionTable');
  table.innerHTML = rows.map(([label, val]) =>
    `<tr><td>${label}</td><td>${val}</td></tr>`
  ).join('');

  document.getElementById('fvIngredients').textContent = item.ingredients;
}

const fvPrevBtn = document.getElementById('fvPrevBtn');
const fvNextBtn = document.getElementById('fvNextBtn');

if (fvPrevBtn && fvNextBtn) {
  fvPrevBtn.addEventListener('click', () => {
    fvCurrentIndex = (fvCurrentIndex - 1 + foodValueItems.length) % foodValueItems.length;
    fvRenderItem(fvCurrentIndex);
  });
  fvNextBtn.addEventListener('click', () => {
    fvCurrentIndex = (fvCurrentIndex + 1) % foodValueItems.length;
    fvRenderItem(fvCurrentIndex);
  });

  fvRenderItem(fvCurrentIndex);
}

const fvSearchInput = document.getElementById('fvSearchInput');
if (fvSearchInput) {
  fvSearchInput.addEventListener('input', () => {
    const query = fvSearchInput.value.trim().toLowerCase();
    const bubble = document.getElementById('fvBubble');
    const noResults = document.getElementById('fvNoResults');

    if (query === '') {
      bubble.style.display = '';
      noResults.hidden = true;
      return;
    }

    const idx = foodValueItems.findIndex(item => item.name.toLowerCase().includes(query));
    if (idx === -1) {
      bubble.style.display = 'none';
      noResults.hidden = false;
    } else {
      bubble.style.display = '';
      noResults.hidden = true;
      fvCurrentIndex = idx;
      fvRenderItem(fvCurrentIndex);
    }
  });
}
