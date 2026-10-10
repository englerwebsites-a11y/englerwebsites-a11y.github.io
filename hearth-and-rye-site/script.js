// Some browsers restore a page from a frozen "snapshot" (the
// back-forward cache) when you navigate to it via certain paths,
// instead of loading it fresh. That snapshot can show stale nav
// state, stale cart/points numbers, or unresponsive buttons. This
// forces a real reload whenever that happens, so every page visit
// always reflects current data and works normally.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

// Smooth-scroll to in-page sections via JS. Using plain buttons
  // (not <a href="#...">) so this never triggers an external-link
  // navigation prompt in embedded previews.
  document.querySelectorAll('[data-scroll]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Specials board — highlights today
  const specials = [
    {d:'Mon', item:'Closed'},
    {d:'Tue', item:'Olive & rosemary loaf'},
    {d:'Wed', item:'Cardamom bun'},
    {d:'Thu', item:'Fig & walnut sourdough'},
    {d:'Fri', item:'Brown butter scone'},
    {d:'Sat', item:'Cheddar & chive biscuit'},
    {d:'Sun', item:'Sticky toffee roll'}
  ];
  const boardEl = document.getElementById('board');
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  if (boardEl) {
    specials.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'board-day' + (i === todayIdx ? ' today' : '');
      el.innerHTML = `<div class="d">${s.d}</div><div class="item">${s.item}</div>`;
      boardEl.appendChild(el);
    });
  }

  // Open/closed status badge, based on the posted hours
  const hoursSchedule = {
    // 0=Sun ... 6=Sat. null = closed all day. Times in 24h.
    0: [7, 13],
    1: null,
    2: [6.5, 14],
    3: [6.5, 14],
    4: [6.5, 14],
    5: [6.5, 14],
    6: [7, 14]
  };
  const badge = document.getElementById('statusBadge');
  if (badge) {
    const now = new Date();
    const todayHours = hoursSchedule[now.getDay()];
    const currentTime = now.getHours() + now.getMinutes() / 60;
    const isOpen = todayHours && currentTime >= todayHours[0] && currentTime < todayHours[1];
    badge.textContent = isOpen ? 'Open now' : 'Closed now';
    badge.classList.add(isOpen ? 'open' : 'closed');
  }

  // Accounts need Firebase. If it fails to load (blocked, offline, outage),
  // keep the rest of the site working and explain the problem on sign-in.
  let auth = null;
  let database = null;
  try {
    auth = firebase.auth();
    database = firebase.firestore();
  } catch (error) {
    console.warn('Accounts are unavailable because Firebase did not load.', error);
  }
  const ACCOUNTS_UNAVAILABLE = "Accounts aren't available right now. Refresh the page or try again later.";
  let currentUser = null;
  let currentAccount = null;

  function getCurrentUser() {
    return currentAccount;
  }
  function getCurrentUserEmail() {
    return currentAccount?.email || null;
  }
  function findAccount(email) {
    const account = getCurrentUser();
    if (!account) return null;
    return account.email.toLowerCase() === String(email).trim().toLowerCase() ? account : null;
  }
  async function loadAccount(user) {
    if (!user) {
      currentUser = null;
      currentAccount = null;
      refreshAccountUI();
      return;
    }

    currentUser = user;
    const snapshot = await database.collection('users').doc(user.uid).get();
    currentAccount = {
      id: user.uid,
      name: snapshot.exists ? snapshot.data().name || user.displayName || 'Friend' : user.displayName || 'Friend',
      email: user.email || '',
      phone: snapshot.exists ? snapshot.data().phone || '' : '',
      points: snapshot.exists ? Number(snapshot.data().points || 0) : 0
    };
    refreshAccountUI();
  }
  async function saveAccount(account) {
    if (!currentUser) return null;
    await database.collection('users').doc(currentUser.uid).set({
      name: account.name || '',
      email: currentUser.email || '',
      phone: account.phone || '',
      points: Number(account.points || 0),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    currentAccount = account;
    refreshAccountUI();
    return account;
  }
  async function updateCurrentAccount(mutatorFn) {
    const account = getCurrentUser();
    if (!account) return null;
    const updated = { ...account };
    mutatorFn(updated);
    return saveAccount(updated);
  }
  function isLoggedIn() {
    return !!currentUser;
  }

  function refreshAccountUI() {
    const account = getCurrentUser();
    const loggedIn = !!account;

    const headerBtn = document.getElementById('accountOpenBtn');
    if (headerBtn) headerBtn.textContent = 'Account';

    const signedOutBlock = document.getElementById('accountSignedOut');
    const signedInBlock = document.getElementById('accountSignedIn');
    if (signedOutBlock && signedInBlock) {
      if (loggedIn) {
        signedOutBlock.hidden = true;
        signedInBlock.hidden = false;
        const nameEl = document.getElementById('accountNameDisplay');
        const emailEl = document.getElementById('accountEmailDisplay');
        if (nameEl) nameEl.textContent = account.name || 'Friend';
        if (emailEl) emailEl.textContent = account.email || '';

        const pts = account.points || 0;
        const pointsNumberEl = document.getElementById('pointsNumberDisplay');
        const pointsFillEl = document.getElementById('pointsProgressFill');
        const pointsNoteEl = document.getElementById('pointsProgressNote');
        if (pointsNumberEl) pointsNumberEl.textContent = pts.toLocaleString();
        if (pointsFillEl) pointsFillEl.style.width = Math.min(100, (pts / 150) * 100) + '%';
        if (pointsNoteEl) {
          pointsNoteEl.textContent = pts >= 150
            ? 'You have enough points for a free item — redeem below!'
            : `${150 - pts} points to your first free item (150 pts)`;
        }
      } else {
        signedOutBlock.hidden = false;
        signedInBlock.hidden = true;
      }
    }
  }

  const modal = document.getElementById('accountModal');
  const openBtn = document.getElementById('accountOpenBtn');
  const openBtnInline = document.getElementById('accountOpenBtnInline');
  const closeBtn = document.getElementById('accountCloseBtn');
  const modalStatus = document.getElementById('modalStatus');

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalStatus.textContent = '';
  }
  if (openBtn) openBtn.addEventListener('click', openModal);
  if (openBtnInline) openBtnInline.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.modal-panel').forEach(panel => {
        panel.hidden = panel.dataset.panel !== target;
      });
      modalStatus.textContent = '';
    });
  });

  async function submitAuthForm(form) {
    const isSignup = form.dataset.form === 'signup';

    if (!auth || !database) {
      modalStatus.textContent = ACCOUNTS_UNAVAILABLE;
      return;
    }

    if (isSignup) {
      const name = document.getElementById('su-name').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const phone = document.getElementById('su-phone').value.trim();
      const password = document.getElementById('su-password').value;

      if (!name || !email || !password) {
        modalStatus.textContent = 'Please fill in your name, email, and password.';
        return;
      }

      try {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        await credential.user.updateProfile({ displayName: name });
        await database.collection('users').doc(credential.user.uid).set({
          name,
          email,
          phone,
          points: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        modalStatus.textContent = `Account created — welcome, ${name}!`;
      } catch (error) {
        modalStatus.textContent = error.code === 'auth/email-already-in-use'
          ? 'An account with that email already exists — try logging in instead.'
          : error.message;
      }
    } else {
      const email = document.getElementById('li-email').value.trim();
      const password = document.getElementById('li-password').value;

      if (!email || !password) {
        modalStatus.textContent = 'Please enter both email and password.';
        return;
      }

      try {
        await auth.signInWithEmailAndPassword(email, password);
        modalStatus.textContent = 'Logged in successfully.';
      } catch (error) {
        modalStatus.textContent = error.code === 'auth/invalid-credential'
          ? 'Incorrect email or password.'
          : error.message;
      }
    }

    form.reset();
  }

  document.querySelectorAll('.auth-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitAuthForm(form);
    });
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (auth) auth.signOut();
    });
  }

  refreshAccountUI();
  if (auth) auth.onAuthStateChanged((user) => {
    loadAccount(user).catch((error) => {
      console.error('Unable to load Firebase account:', error);
      currentUser = null;
      currentAccount = null;
      refreshAccountUI();
    });
  });

  // Contact form — uses FormSubmit's free email endpoint so the site
  // can receive messages without exposing an email-service API key.
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const message = document.getElementById('cf-message').value.trim();
      const status = document.getElementById('formStatus');

      if (!name || !email || !message) {
        status.textContent = 'Please fill in your name, email, and message.';
        return;
      }

      status.textContent = 'Sending your message...';

      try {
        const response = await fetch('https://formsubmit.co/ajax/englerwebsites@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            message,
            _subject: `Message from ${name} via Hearth & Rye site`,
            _replyto: email,
            _captcha: 'true',
            _template: 'table'
          })
        });
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(response.ok
            ? 'The server returned an unexpected response.'
            : 'The contact service is not connected to this hosted site yet.');
        }

        if (!response.ok || data.success === false || data.success === 'false') {
          throw new Error(data.error || data.message || 'Unable to send your message.');
        }

        status.textContent = 'Your message was sent successfully.';
        contactForm.reset();
      } catch (error) {
        status.textContent = error.message || 'Unable to send your message.';
      }
    });
  }

  // Fade-in on scroll now lives in site-ui.js so it works even if Firebase fails.

// Menu search — live filters visible menu items as you type.
// Only present on menu.html, guarded so it's safe in the shared script.
const menuSearchInput = document.getElementById('menuSearchInput');
if (menuSearchInput) {
  const menuCols = document.querySelectorAll('.menu-category');
  const noResultsEl = document.getElementById('menuNoResults');

  menuSearchInput.addEventListener('input', () => {
    const query = menuSearchInput.value.trim().toLowerCase();
    let anyVisible = false;

    menuCols.forEach(col => {
      const categoryLabel = col.querySelector('.menu-category-label');
      const categoryMatches = categoryLabel && categoryLabel.textContent.toLowerCase().includes(query) && query.length > 0;

      let colHasVisibleItem = false;
      col.querySelectorAll('.menu-item').forEach(item => {
        const text = item.querySelector('.name').textContent.toLowerCase();
        const matches = categoryMatches || text.includes(query);
        item.classList.toggle('is-hidden', !matches);
        if (matches) colHasVisibleItem = true;
      });
      col.classList.toggle('is-hidden', !colHasVisibleItem);
      if (colHasVisibleItem) anyVisible = true;
    });

    if (noResultsEl) noResultsEl.hidden = anyVisible;
  });
}

// Rewards cart — items redeemed with points. Separate from the food
// cart; tracked so redemptions show up as real pickup items instead
// of just silently deducting points with no lasting effect.
const REWARDS_CART_KEY = 'hr_rewards_cart';

function getRewardsCart() {
  try {
    const raw = localStorage.getItem(REWARDS_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function saveRewardsCart(cart) {
  try { localStorage.setItem(REWARDS_CART_KEY, JSON.stringify(cart)); } catch (e) {}
}
function getRewardsCartQty(name) {
  const item = getRewardsCart().find(i => i.name === name);
  return item ? item.qty : 0;
}
// Adding (+) deducts points immediately; removing (-) refunds them.
// Returns { status, qty } where status is 'ok', 'not-logged-in', or
// 'not-enough-points'.
function changeRewardsCartQty(name, points, delta) {
  const email = getCurrentUserEmail();
  const account = email ? findAccount(email) : null;
  if (!account) return { status: 'not-logged-in', qty: getRewardsCartQty(name) };

  const cart = getRewardsCart();
  const idx = cart.findIndex(i => i.name === name);

  if (delta > 0) {
    if ((account.points || 0) < points) {
      return { status: 'not-enough-points', qty: getRewardsCartQty(name) };
    }
    if (idx === -1) cart.push({ name, points, qty: 1 });
    else cart[idx].qty += 1;
    updateCurrentAccount(acc => { acc.points = (acc.points || 0) - points; });
  } else {
    if (idx === -1) return { status: 'ok', qty: 0 };
    cart[idx].qty -= 1;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCurrentAccount(acc => { acc.points = (acc.points || 0) + points; });
  }

  saveRewardsCart(cart);
  refreshAccountUI();
  return { status: 'ok', qty: getRewardsCartQty(name) };
}

// Redeem cards — present on the account page AND the cart page
// (same markup, same behavior). Same lock/flash pattern as the menu
// so rapid clicking is prevented here too.
let rewardsActionLocked = false;

document.querySelectorAll('.redeem-card[data-name]').forEach(card => {
  const qtyEl = card.querySelector('.redeem-qty-num');
  if (qtyEl) qtyEl.textContent = getRewardsCartQty(card.dataset.name);
});

document.querySelectorAll('.redeem-card .qty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (rewardsActionLocked) return;
    rewardsActionLocked = true;

    const card = btn.closest('.redeem-card');
    const name = card.dataset.name;
    const points = parseInt(card.dataset.points, 10) || 0;
    const delta = btn.dataset.action === 'inc' ? 1 : -1;

    const result = changeRewardsCartQty(name, points, delta);

    const qtyEl = card.querySelector('.redeem-qty-num');
    if (qtyEl) qtyEl.textContent = result.qty;

    const statusEl = card.querySelector('.redeem-status');
    if (statusEl) {
      statusEl.textContent =
        result.status === 'not-logged-in' ? 'Log in to redeem' :
        result.status === 'not-enough-points' ? 'Not enough points' : '';
    }

    card.classList.add('flashing');
    const allRewardBtns = document.querySelectorAll('.redeem-card .qty-btn');
    allRewardBtns.forEach(b => b.disabled = true);

    setTimeout(() => {
      card.classList.remove('flashing');
      allRewardBtns.forEach(b => b.disabled = false);
      rewardsActionLocked = false;
    }, 500);
  });
});

// Shopping cart — stored in localStorage, shared across pages once
// hosted (see the account-system note above re: file:// testing).
const CART_KEY = 'hr_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
}
function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
}
function getCartQty(name) {
  const item = getCart().find(i => i.name === name);
  return item ? item.qty : 0;
}
function changeCartQty(name, price, delta) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.name === name);
  if (delta > 0) {
    if (idx === -1) cart.push({ name, price, qty: 1 });
    else cart[idx].qty += 1;
  } else if (idx !== -1) {
    cart[idx].qty -= 1;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
  }
  saveCart(cart);
  updateCartBadge();
  return getCartQty(name);
}
function updateCartBadge() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-count').forEach(badge => {
    if (totalQty > 0) {
      badge.textContent = totalQty;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  });
}
updateCartBadge();

// Menu items — a +/- stepper per item instead of clicking the whole
// card. While one button is processing, ALL menu +/- buttons on the
// page lock for half a second (with a darken flash on the card that
// was clicked) so rapid/spam clicking across items isn't possible.
let menuActionLocked = false;

document.querySelectorAll('.menu-item[data-name]').forEach(item => {
  const name = item.dataset.name;
  const qtyEl = item.querySelector('.menu-item-qty-num');
  if (qtyEl) qtyEl.textContent = getCartQty(name);
});

document.querySelectorAll('.menu-item .qty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (menuActionLocked) return;
    menuActionLocked = true;

    const item = btn.closest('.menu-item');
    const name = item.dataset.name;
    const price = parseFloat(item.dataset.price);
    const delta = btn.dataset.action === 'inc' ? 1 : -1;
    const newQty = changeCartQty(name, price, delta);

    const qtyEl = item.querySelector('.menu-item-qty-num');
    if (qtyEl) qtyEl.textContent = newQty;

    item.classList.add('flashing');
    const allMenuBtns = document.querySelectorAll('.menu-item .qty-btn');
    allMenuBtns.forEach(b => b.disabled = true);

    setTimeout(() => {
      item.classList.remove('flashing');
      allMenuBtns.forEach(b => b.disabled = false);
      menuActionLocked = false;
    }, 500);
  });
});

// Cart page — render items, handle qty/remove, rewards-points
// checkout toggle, and the final "place order" flow.
function renderCart() {
  const emptyState = document.getElementById('cartEmptyState');
  const filledState = document.getElementById('cartFilledState');
  if (!emptyState || !filledState) return; // not on the cart page

  const confirmState = document.getElementById('cartConfirmState');
  if (confirmState && !confirmState.hidden) return; // don't re-render over the confirmation

  const cart = getCart();
  const rewardsCart = getRewardsCart();
  if (cart.length === 0 && rewardsCart.length === 0) {
    emptyState.hidden = false;
    filledState.hidden = true;
    return;
  }
  emptyState.hidden = true;
  filledState.hidden = false;

  const listEl = document.getElementById('cartItemsList');
  listEl.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item, idx) => {
    subtotal += item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML =
      '<div class="cart-item-info">' +
        '<span class="cart-item-name">' + item.name + '</span>' +
        '<span class="cart-item-price">$' + item.price.toFixed(2) + ' each</span>' +
      '</div>' +
      '<div class="cart-item-qty">' +
        '<button type="button" class="qty-btn" data-action="dec" data-idx="' + idx + '">\u2212</button>' +
        '<span>' + item.qty + '</span>' +
        '<button type="button" class="qty-btn" data-action="inc" data-idx="' + idx + '">+</button>' +
      '</div>' +
      '<button type="button" class="cart-item-remove" data-action="remove" data-idx="' + idx + '">Remove</button>';
    listEl.appendChild(row);
  });

  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  document.getElementById('cartSubtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('cartTax').textContent = '$' + tax.toFixed(2);
  document.getElementById('cartTotal').textContent = '$' + total.toFixed(2);

  listEl.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const action = btn.dataset.action;
      const cart2 = getCart();
      if (action === 'inc') cart2[idx].qty += 1;
      if (action === 'dec') {
        cart2[idx].qty -= 1;
        if (cart2[idx].qty <= 0) cart2.splice(idx, 1);
      }
      if (action === 'remove') cart2.splice(idx, 1);
      saveCart(cart2);
      updateCartBadge();
      renderCart();
      refreshRewardsBox();
    });
  });
}

function refreshRewardsBox() {
  const headline = document.getElementById('rewardsHeadline');
  const sub = document.getElementById('rewardsSub');
  const toggleWrap = document.getElementById('rewardsToggleWrap');
  if (!headline) return; // not on the cart page

  const email = getCurrentUserEmail();
  const account = email ? findAccount(email) : null;
  const rewardsToggleInput = document.getElementById('rewardsToggle');

  const cart = getCart();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal * 1.08;
  const pointsNeeded = Math.round(total * 100); // 1 point = 1 cent

  if (!account) {
    headline.textContent = 'Log in to pay with points';
    sub.textContent = 'Sign in from the Account button above to use your rewards balance toward this order.';
    toggleWrap.hidden = true;
    if (rewardsToggleInput) { rewardsToggleInput.checked = false; rewardsToggleInput.disabled = true; }
  } else {
    const pts = account.points || 0;
    headline.textContent = `You have ${pts.toLocaleString()} points`;
    if (pointsNeeded > 0 && pts >= pointsNeeded) {
      sub.textContent = `This order costs ${pointsNeeded.toLocaleString()} points \u2014 you have enough to pay with rewards instead of a card.`;
      toggleWrap.hidden = false;
      if (rewardsToggleInput) rewardsToggleInput.disabled = false;
    } else {
      sub.textContent = pointsNeeded > 0
        ? `You need ${pointsNeeded.toLocaleString()} points to pay for this order with rewards \u2014 keep earning!`
        : '';
      toggleWrap.hidden = true;
      if (rewardsToggleInput) { rewardsToggleInput.checked = false; rewardsToggleInput.disabled = true; }
    }
  }
}

// Prefill checkout contact info from the logged-in account, if any
const coNameEl = document.getElementById('co-name');
if (coNameEl) {
  const email = getCurrentUserEmail();
  const account = email ? findAccount(email) : null;
  if (account) {
    coNameEl.value = account.name || '';
    const coEmailEl = document.getElementById('co-email');
    const coPhoneEl = document.getElementById('co-phone');
    if (coEmailEl) coEmailEl.value = account.email || '';
    if (coPhoneEl) coPhoneEl.value = account.phone || '';
  }
}

renderCart();
refreshRewardsBox();

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cart = getCart();
    const rewardsCart = getRewardsCart();
    if (cart.length === 0 && rewardsCart.length === 0) return;

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal * 1.08;
    const pointsNeeded = Math.round(total * 100);

    const toggleWrap = document.getElementById('rewardsToggleWrap');
    const rewardsToggle = document.getElementById('rewardsToggle');
    const usePoints = toggleWrap && !toggleWrap.hidden && rewardsToggle && rewardsToggle.checked;

    let confirmMsg = '';
    if (subtotal === 0) {
      confirmMsg = '';
    } else if (usePoints) {
      updateCurrentAccount(acc => { acc.points = (acc.points || 0) - pointsNeeded; });
      confirmMsg = `You paid with ${pointsNeeded.toLocaleString()} rewards points.`;
    } else {
      const email = getCurrentUserEmail();
      if (email) {
        const earned = Math.round(total * 5);
        updateCurrentAccount(acc => { acc.points = (acc.points || 0) + earned; });
        confirmMsg = `You earned ${earned.toLocaleString()} rewards points on this order.`;
      } else {
        confirmMsg = 'Create an account next time to start earning rewards points on your orders.';
      }
    }

    if (rewardsCart.length > 0) {
      const rewardsList = rewardsCart.map(r => `${r.qty}x ${r.name}`).join(', ');
      const rewardsLine = `Redeemed with points: ${rewardsList}.`;
      confirmMsg = confirmMsg ? confirmMsg + ' ' + rewardsLine : rewardsLine;
    }

    const pickupTime = new Date(Date.now() + 15 * 60000);
    const timeStr = pickupTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const confirmMessageEl = document.getElementById('confirmMessage');
    const confirmPickupEl = document.getElementById('confirmPickup');
    if (confirmMessageEl) confirmMessageEl.textContent = confirmMsg;
    if (confirmPickupEl) confirmPickupEl.textContent =
      `Your order will be ready for pickup at ${timeStr} (about 15 minutes from now).`;

    saveCart([]);
    saveRewardsCart([]);
    updateCartBadge();

    // The redeem grid stays visible on this page even with an empty
    // cart, so its quantity numbers need to be reset explicitly —
    // they don't disappear along with the (now-hidden) cart section.
    document.querySelectorAll('.redeem-card[data-name] .redeem-qty-num').forEach(el => {
      el.textContent = '0';
    });

    document.getElementById('cartFilledState').hidden = true;
    document.getElementById('cartEmptyState').hidden = true;
    document.getElementById('cartConfirmState').hidden = false;

    checkoutForm.reset();
  });
}
