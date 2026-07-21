const cart = [];

function getItemData(el) {
  const parent = el.closest('[data-name]');
  return { name: parent.dataset.name, price: parseInt(parent.dataset.price) };
}

function addToCart(btn) {
  const { name, price } = getItemData(btn);
  upsert(name, price);
  flash(btn);
  renderCart();
  pulseFab();
}

// shared handler for add-ons and list rows
function addAddonToCart(btn) { addToCart(btn); }
function addListToCart(btn)  { addToCart(btn); }

function upsert(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty++;
  else cart.push({ name, price, qty: 1 });
}

function flash(btn) {
  btn.classList.add('added');
  setTimeout(() => btn.classList.remove('added'), 600);
}

function shake(id) {
  const el = document.getElementById(id);
  el.focus();
  el.classList.add('input-error');
  setTimeout(() => el.classList.remove('input-error'), 2000);
}

function pulseFab() {
  const fab = document.getElementById('cartFab');
  fab.classList.remove('pulse');
  void fab.offsetWidth; // reflow to restart animation
  fab.classList.add('pulse');
}

// Called from qty buttons via data-index, not name strings (avoids apostrophe bugs)
function changeQty(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
}

function clearCart() {
  cart.length = 0;
  renderCart();
}

function renderCart() {
  resetSendButton();
  const itemsEl  = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const countEl  = document.getElementById('cartCount');
  const totalEl  = document.getElementById('cartTotal');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  countEl.textContent = count;
  countEl.style.display = count > 0 ? 'flex' : 'none';
  totalEl.textContent = `₱${total.toLocaleString()}`;

  if (cart.length === 0) {
    footerEl.style.display = 'none';
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span>🛒</span>
        <p>Your cart is empty.<br/>Add items from the menu!</p>
      </div>`;
    return;
  }

  footerEl.style.display = 'flex';
  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <span class="cart-item-name">${item.name}</span>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
      </div>
      <span class="cart-item-price">₱${(item.price * item.qty).toLocaleString()}</span>
    </div>
  `).join('');
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function toggleCart() {
  document.getElementById('cartDrawer').classList.contains('open') ? closeCart() : openCart();
}

let orderType = 'delivery';

function setOrderType(type) {
  orderType = type;
  document.getElementById('btnDelivery').classList.toggle('active', type === 'delivery');
  document.getElementById('btnPickup').classList.toggle('active', type === 'pickup');
  document.getElementById('fieldAddress').style.display = type === 'delivery' ? 'flex' : 'none';
  document.getElementById('fieldTime').style.display    = type === 'pickup'   ? 'flex' : 'none';
  document.getElementById('cartFeeRow').style.display   = type === 'delivery' ? 'flex' : 'none';
  document.getElementById('cartTotalLabel').textContent = type === 'delivery' ? 'Food total' : 'Total';
}

function sendOrder() {
  if (cart.length === 0) return;

  const branch  = document.getElementById('cartBranch').value;
  const address = document.getElementById('cartAddress').value.trim();
  const time    = document.getElementById('cartTime').value;
  const phone   = document.getElementById('cartPhone').value.trim();
  const note    = document.getElementById('cartNote').value.trim();

  if (!branch) { shake('cartBranch'); return; }
  if (orderType === 'delivery' && !address) { shake('cartAddress'); return; }
  if (orderType === 'pickup'   && !time)    { shake('cartTime');    return; }
  if (!phone) { shake('cartPhone'); return; }

  const lines = cart.map(i => `• ${i.name} x${i.qty} — ₱${(i.price * i.qty).toLocaleString()}`).join('\n');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  let msg = `Hi Chomp Pizza! 🍕 I'd like to place an order:\n\n${lines}\n\nTOTAL: ₱${total.toLocaleString()}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  msg += orderType === 'delivery'
    ? `\n\n🛵 Delivery to: ${address}\n📍 Map: ${mapsLink}\n💰 Delivery fee: ₱50 first 2 km + ₱20/km after (please confirm my exact fee)`
    : `\n\n🏪 Pickup at: ${time}`;
  msg += `\n🏬 Branch: ${branch}`;
  msg += `\n📞 Contact: ${phone}`;
  if (note) msg += `\n\n📝 Notes: ${note}`;

  // Messenger can't pre-fill messages, so copy the order and let the customer paste it.
  // A real link tap is required for phones to open the Messenger app directly,
  // so we swap the button for an anchor and let the user tap that.
  navigator.clipboard.writeText(msg).catch(() => {});
  document.querySelector('button.btn-send-order').style.display = 'none';
  document.getElementById('openMessengerLink').style.display = 'flex';
  document.getElementById('sendHint').innerHTML =
    'Your order is copied! 📋 Once Messenger opens, <strong>paste it in the chat</strong> and send.';
}

function resetSendButton() {
  const btn = document.querySelector('button.btn-send-order');
  const link = document.getElementById('openMessengerLink');
  if (btn && link) {
    btn.style.display = 'flex';
    link.style.display = 'none';
    document.getElementById('sendHint').innerHTML =
      'Your order will be copied automatically — just <strong>paste it in the Messenger chat</strong> and send! 📋';
  }
}

// Card entrance animation
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(18px)';
  card.style.transition = `opacity .4s ease ${i * 0.04}s, transform .4s ease ${i * 0.04}s, box-shadow .2s`;
  observer.observe(card);
});

renderCart();
