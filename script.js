/* ============================================================
   WEDDING WEBSITE — Magda & Ivan
   script.js
   ============================================================ */

/* --- Navbar scroll class ----------------------------------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

/* --- Mobile hamburger menu --------------------------------- */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('is-open');
  hamburger.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu when a link is tapped
document.querySelectorAll('.nav__mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', false);
  });
});

// Close mobile menu when tapping outside
document.addEventListener('click', (e) => {
  if (mobileMenu.classList.contains('is-open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)) {
    mobileMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', false);
  }
});

/* --- Countdown -------------------------------------------- */
const WEDDING_DATE = new Date('2026-09-25T11:00:00+02:00');

function updateCountdown() {
  const now  = new Date();
  const diff = WEDDING_DATE - now;

  if (diff <= 0) {
    document.getElementById('cd-days').textContent    = '0';
    document.getElementById('cd-hours').textContent   = '0';
    document.getElementById('cd-minutes').textContent = '0';
    document.getElementById('cd-seconds').textContent = '0';
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('cd-days').textContent    = String(days);
  document.getElementById('cd-hours').textContent   = String(hours).padStart(2, '0');
  document.getElementById('cd-minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('cd-seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* --- RSVP: helpers ----------------------------------------- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns the HTML for a dietary checkbox block for a given personId */
function dietaryHTML(personId) {
  const opts = [
    { v: 'nessuna',     l: 'Nessuna esigenza' },
    { v: 'vegetariano', l: 'Vegetariano/a' },
    { v: 'vegano',      l: 'Vegano/a' },
    { v: 'glutine',     l: 'Senza glutine' },
    { v: 'lattosio',    l: 'Intollerante al lattosio' },
    { v: 'noci',        l: 'Allergia alle noci' },
  ];
  const checks = opts.map(o =>
    `<label class="form__check"><input type="checkbox" name="d-${personId}" value="${o.v}"><span>${o.l}</span></label>`
  ).join('');
  return `
    <div class="form__dietary" data-person="${personId}">
      ${checks}
      <label class="form__check form__check--altro">
        <input type="checkbox" name="d-${personId}" value="altro">
        <span>Altro:</span>
        <input type="text" class="form__input form__input--inline" name="d-${personId}-altro" placeholder="specifica…" disabled>
      </label>
    </div>`;
}

/** Returns HTML for a child card */
function childCardHTML(n) {
  return `
    <div class="form__person-card" id="child-${n}">
      <p class="form__person-tag">Bambino ${n}</p>
      <div class="form__row">
        <div class="form__group">
          <label class="form__label">Nome</label>
          <input class="form__input" type="text" name="child-${n}-firstName" placeholder="Nome" />
        </div>
        <div class="form__group">
          <label class="form__label">Cognome</label>
          <input class="form__input" type="text" name="child-${n}-lastName" placeholder="Cognome" />
        </div>
      </div>
      <div class="form__group">
        <label class="form__label">Esigenze alimentari <span class="req">*</span></label>
        ${dietaryHTML('child-' + n)}
      </div>
    </div>`;
}

/** Reads checked dietary values for a person; returns array of strings */
function getDietary(personId) {
  const block = document.querySelector(`.form__dietary[data-person="${personId}"]`);
  if (!block) return [];
  const checked = [...block.querySelectorAll(`input[name="d-${personId}"]:checked`)].map(c => c.value);
  const altroText = block.querySelector(`input[name="d-${personId}-altro"]`);
  if (checked.includes('altro') && altroText?.value.trim()) {
    return checked.filter(v => v !== 'altro').concat('altro: ' + altroText.value.trim());
  }
  return checked;
}

/** Validates that at least one dietary option is selected (and altro filled if chosen) */
function validateDietary(personId) {
  const block = document.querySelector(`.form__dietary[data-person="${personId}"]`);
  if (!block) return true;
  const checked = [...block.querySelectorAll(`input[name="d-${personId}"]:checked`)];
  if (checked.length === 0) return false;
  if (checked.some(c => c.value === 'altro')) {
    const altroText = block.querySelector(`input[name="d-${personId}-altro"]`);
    if (!altroText?.value.trim()) return false;
  }
  return true;
}

/* --- RSVP: dietary checkbox logic (delegation) ------------- */
document.addEventListener('change', (e) => {
  const cb = e.target;
  if (cb.type !== 'checkbox') return;
  const block = cb.closest('.form__dietary');
  if (!block) return;
  const pid = block.dataset.person;

  if (cb.value === 'nessuna' && cb.checked) {
    block.querySelectorAll(`input[name="d-${pid}"]`).forEach(c => { if (c !== cb) c.checked = false; });
    const t = block.querySelector(`input[name="d-${pid}-altro"]`);
    if (t) { t.disabled = true; t.value = ''; }
  } else if (cb.value !== 'nessuna' && cb.checked) {
    const nessuna = block.querySelector(`input[value="nessuna"]`);
    if (nessuna) nessuna.checked = false;
  }

  if (cb.value === 'altro') {
    const t = block.querySelector(`input[name="d-${pid}-altro"]`);
    if (t) { t.disabled = !cb.checked; if (!cb.checked) t.value = ''; }
  }
});

/* --- RSVP: attendance toggle (show/hide full form) --------- */
const rsvpYesSection = document.getElementById('rsvpYesSection');
document.querySelectorAll('input[name="attendance"]').forEach(r => {
  r.addEventListener('change', () => {
    rsvpYesSection.style.display = r.value === 'yes' ? 'block' : 'none';
  });
});

/* --- RSVP: plus-one toggle --------------------------------- */
const plusOneDetails = document.getElementById('plusOneDetails');
document.querySelectorAll('input[name="plusOne"]').forEach(r => {
  r.addEventListener('change', () => {
    plusOneDetails.style.display = r.value === 'yes' ? 'block' : 'none';
    if (r.value !== 'yes') {
      document.getElementById('plusFirstName').value = '';
      document.getElementById('plusLastName').value  = '';
    }
  });
});

/* --- RSVP: children toggle + dynamic cards ----------------- */
const childrenSection = document.getElementById('childrenSection');
const childrenCards   = document.getElementById('childrenCards');
const childrenCount   = document.getElementById('childrenCount');

document.querySelectorAll('input[name="hasChildren"]').forEach(r => {
  r.addEventListener('change', () => {
    childrenSection.style.display = r.value === 'yes' ? 'block' : 'none';
    if (r.value !== 'yes') { childrenCards.innerHTML = ''; childrenCount.value = ''; }
  });
});

childrenCount.addEventListener('change', () => {
  const n = parseInt(childrenCount.value) || 0;
  childrenCards.innerHTML = '';
  for (let i = 1; i <= n; i++) childrenCards.insertAdjacentHTML('beforeend', childCardHTML(i));
});

/* --- RSVP Form submission ---------------------------------- */
const form        = document.getElementById('rsvpForm');
const formSuccess = document.getElementById('formSuccess');
const formError   = document.getElementById('formError');
const formErrorMsg = document.getElementById('formErrorMsg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.style.display   = 'none';
  formSuccess.style.display = 'none';

  const firstName  = form.firstName.value.trim();
  const lastName   = form.lastName.value.trim();
  const attendance = form.querySelector('input[name="attendance"]:checked');
  const attending  = attendance?.value === 'yes';

  let valid = true;
  let errorMsg = 'Compilate tutti i campi obbligatori prima di inviare.';

  [form.firstName, form.lastName].forEach(f => f.classList.remove('is-invalid'));
  form.email?.classList.remove('is-invalid');
  form.message?.classList.remove('is-invalid');

  if (!firstName) { form.firstName.classList.add('is-invalid'); valid = false; }
  if (!lastName)  { form.lastName.classList.add('is-invalid');  valid = false; }
  if (!attendance) { valid = false; }

  const message    = form.message?.value.trim() || '';
  const plusOneVal = form.querySelector('input[name="plusOne"]:checked')?.value;
  const childCount = parseInt(childrenCount.value) || 0;

  if (attending) {
    if (!validateDietary('main')) { valid = false; errorMsg = 'Selezionate almeno un\'esigenza alimentare per ogni ospite.'; }
    if (plusOneVal === 'yes' && !validateDietary('plus')) { valid = false; errorMsg = 'Selezionate le esigenze alimentari per l\'accompagnatore.'; }
    if (!message) { form.message.classList.add('is-invalid'); valid = false; }
    for (let i = 1; i <= childCount; i++) {
      if (!validateDietary('child-' + i)) { valid = false; errorMsg = 'Selezionate le esigenze alimentari per ogni bambino.'; }
    }
  }

  if (!valid) {
    formErrorMsg.textContent = errorMsg;
    formError.style.display = 'block';
    formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  /* Build rows — one per person, ready for Google Sheets / webhook */
  const bookingId = Date.now().toString(36).toUpperCase();
  const timestamp = new Date().toISOString();
  const rows = [];

  if (attending) {
    rows.push({
      bookingId, timestamp,
      tipo: 'principale',
      nome: firstName, cognome: lastName,
      partecipa: 'yes',
      dietary: getDietary('main').join(', '),
      messaggio: message,
    });
    if (plusOneVal === 'yes') {
      rows.push({
        bookingId, timestamp,
        tipo: 'accompagnatore',
        nome: form.plusFirstName.value.trim(), cognome: form.plusLastName.value.trim(), email: '',
        partecipa: 'yes',
        dietary: getDietary('plus').join(', '),
        messaggio: '',
      });
    }
    for (let i = 1; i <= childCount; i++) {
      rows.push({
        bookingId, timestamp,
        tipo: 'bambino_' + i,
        nome: form[`child-${i}-firstName`]?.value.trim() || '',
        cognome: form[`child-${i}-lastName`]?.value.trim() || '',
        email: '', partecipa: 'yes',
        dietary: getDietary('child-' + i).join(', '),
        messaggio: '',
      });
    }
  } else {
    rows.push({ bookingId, timestamp, tipo: 'principale', nome: firstName, cognome: lastName, partecipa: 'no', dietary: '', messaggio: '' });
  }

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbz3e4CIvHcFys75wFcYfoE9wIhX5WYZ5VfVQIPX363Jir-7Z83IkhLXYu-c5peFJFsi/exec';
  fetch(SHEET_URL, { method: 'POST', body: JSON.stringify(rows) }).catch(() => {});

  /* Reset */
  document.getElementById('formSuccessMsg').textContent = attending
    ? 'Grazie! Non vediamo l\'ora di festeggiare con voi. A presto!'
    : 'Grazie per averci fatto sapere. Non sarete fisicamente con noi, ma vi avremo nel nostro cuore in questo giorno speciale.';
  form.style.display        = 'none';
  formSuccess.style.display = 'block';
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* --- Timeline items (tap to expand on mobile) -------------- */
document.querySelectorAll('.timeline__item').forEach(item => {
  item.addEventListener('click', () => {
    item.classList.toggle('is-open');
  });
});

/* --- Attire trio ------------------------------------------- */
const colorBtns = document.querySelectorAll('.attire__color-btn');
const colorLabel = document.getElementById('attire-color-label');
const colorNames = {
  'borgogna':      'Borgogna',
  'rosa-antico':   'Rosa Antico',
  'beige':         'Beige',
  'verde-foresta': 'Verde Foresta',
  'verde-salvia':  'Verde Salvia',
  'blu':           'Blu',
  'azzurro':       'Azzurro',
  'lilla':         'Lilla',
};

function showColor(color) {
  colorBtns.forEach(b => b.classList.remove('is-active'));
  document.querySelector(`.attire__color-btn[data-color="${color}"]`).classList.add('is-active');
  document.querySelectorAll('[data-ivan]').forEach(p => p.classList.remove('is-active'));
  document.querySelectorAll('[data-magda]').forEach(p => p.classList.remove('is-active'));
  document.querySelector(`[data-ivan="${color}"]`).classList.add('is-active');
  document.querySelector(`[data-magda="${color}"]`).classList.add('is-active');
  if (colorLabel) colorLabel.textContent = colorNames[color] ?? color;
}

colorBtns.forEach(btn => {
  btn.addEventListener('click',      () => showColor(btn.dataset.color));
  btn.addEventListener('mouseenter', () => showColor(btn.dataset.color));
});

/* --- Contribute modal -------------------------------------- */
const contributeBtn   = document.getElementById('contributeBtn');
const contributeModal = document.getElementById('contributeModal');
const modalClose      = document.getElementById('modalClose');
const modalBackdrop   = document.getElementById('modalBackdrop');

function openModal() {
  contributeModal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  contributeModal.classList.remove('is-open');
  document.body.style.overflow = '';
}

contributeBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* --- Smooth scroll for anchor links ----------------------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* --- Su di noi: 2×2 expand grid --------------------------- */
const aboutGrid = document.querySelector('.about-grid');
if (aboutGrid) {
  const gridItems = aboutGrid.querySelectorAll('.about-grid__item');
  const hasHover = () => window.matchMedia('(hover: hover)').matches;

  function activateItem(item) {
    gridItems.forEach(i => i.classList.remove('is-active'));
    item.classList.add('is-active');
    aboutGrid.classList.add('has-active');
  }
  function deactivateAll() {
    gridItems.forEach(i => i.classList.remove('is-active'));
    aboutGrid.classList.remove('has-active');
  }

  // Desktop: hover to expand / leave grid to collapse
  gridItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      if (hasHover()) activateItem(item);
    });
  });
  aboutGrid.addEventListener('mouseleave', () => {
    if (hasHover()) deactivateAll();
  });

  // Mobile: click to toggle
  gridItems.forEach(item => {
    item.addEventListener('click', () => {
      if (!hasHover()) {
        if (item.classList.contains('is-active')) deactivateAll();
        else activateItem(item);
      }
    });
  });
}

/* --- Reveal on scroll (subtle fade-in) -------------------- */
const revealElements = document.querySelectorAll(
  '.timeline__item, .attire__card, .wish-card, .section__header, .attire__note, .wishlist__note'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

/* Inject the CSS for reveal animation */
const revealStyle = document.createElement('style');
revealStyle.textContent = `
  .timeline__item,
  .attire__card,
  .wish-card,
  .section__header,
  .attire__note,
  .wishlist__note {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .timeline__item.is-visible,
  .attire__card.is-visible,
  .wish-card.is-visible,
  .section__header.is-visible,
  .attire__note.is-visible,
  .wishlist__note.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(revealStyle);

revealElements.forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  revealObserver.observe(el);
});
