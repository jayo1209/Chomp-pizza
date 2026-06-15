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
  const itemsEl  = document.getElementById('cartItems');
  const emptyEl  = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const countEl  = document.getElementById('cartCount');
  const totalEl  = document.getElementById('cartTotal');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  countEl.textContent = count;
  countEl.style.display = count > 0 ? 'flex' : 'none';
  totalEl.textContent = `₱${total.toLocaleString()}`;

  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    itemsEl.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
    footerEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  footerEl.style.display = 'flex';

  // Use index-based onclick so item names with apostrophes never break
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

function sendOrder() {
  if (cart.length === 0) return;

  const lines = cart.map(i => `• ${i.name} x${i.qty} — ₱${(i.price * i.qty).toLocaleString()}`).join('\n');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const note  = document.getElementById('cartNote').value.trim();

  let msg = `Hi Chomp Pizza! 🍕 I'd like to place an order:\n\n${lines}\n\n*TOTAL: ₱${total.toLocaleString()}*`;
  if (note) msg += `\n\n📝 Notes: ${note}`;

  window.open(`https://wa.me/639626922373?text=${encodeURIComponent(msg)}`, '_blank');
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
