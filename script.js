/* ===== Config: FAQ content (plan prices live in index.html via data-price) ===== */
const FAQS = [
  ['هل يوجد قسم خاص للسيدات؟', 'نعم، قسم السيدات منفصل بمدربات متخصصات وحصص جماعية في أجواء مريحة.'],
  ['هل يمكنني تجربة الجيم قبل الاشتراك؟', 'بالتأكيد. احجز حصة تجريبية مجانية من قسم الحجز واكتشف النادي بنفسك.'],
  ['ما أسعار الاشتراكات؟', 'الاشتراك الشهري 120 ₪، و3 أشهر بـ 300 ₪، و6 أشهر بـ 500 ₪.'],
  ['هل يوجد تدريب شخصي؟', 'نعم، التدريب الشخصي متاح في القسمين مع خطة مصممة لهدفك.'],
  ['ما أوقات العمل؟', 'نفتح يوميًا من 6:00 صباحًا حتى 11:00 مساءً.'],
  ['كيف يمكنني حجز اشتراك؟', 'اختر الباقة واملأ نموذج الحجز، وسنتواصل معك لتأكيد الموعد.']
];
const GENDER = { men: 'رجال', women: 'سيدات' };
const CUR = '₪';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Plans are read from the cards in the HTML, so editing prices there updates the form too */
const PLANS = $$('[data-plan]').map(b => ({ id: b.dataset.plan, name: b.dataset.name, price: +b.dataset.price }));
$('#plan').innerHTML = '<option value="">اختر الباقة</option>' +
  PLANS.map(p => `<option value="${p.id}">${p.name} — ${p.price} ${CUR}</option>`).join('');

$('#faqList').innerHTML = FAQS.map(([q, a], i) => `
  <div class="faq-item"><button class="faq-q" aria-expanded="false" aria-controls="fa${i}">${q}</button>
  <div class="faq-a" id="fa${i}"><p>${a}</p></div></div>`).join('');

/* ===== Header / mobile menu ===== */
const menu = $('#menu'), burger = $('#burger');
const setMenu = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeModal(); } });
const onScroll = () => $('#header').classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* Highlight the active nav link */
const links = $$('.menu a');
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['home', 'men', 'women', 'plans', 'trainers', 'contact'].forEach(id => $('#' + id) && spy.observe($('#' + id)));

/* Scroll reveal */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));

/* FAQ accordion (one open at a time) */
$('#faqList').addEventListener('click', e => {
  const b = e.target.closest('.faq-q'); if (!b) return;
  const open = b.getAttribute('aria-expanded') === 'true';
  $$('.faq-q').forEach(x => x.setAttribute('aria-expanded', 'false'));
  b.setAttribute('aria-expanded', String(!open));
});

/* ===== Booking ===== */
const form = $('#bookForm');
const today = new Date().toISOString().split('T')[0];
let mode = 'sub';
$('#date').min = today; $('#date').value = today;

function setMode(m) {
  mode = m;
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.type === m));
  $('#planField').hidden = m === 'trial';
  if (m === 'trial') $('#plan').value = '';
  updateSummary();
}
$$('.tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.type)));

function goBooking({ gender, plan, trial } = {}) {
  if (gender) form.querySelector(`input[name=gender][value=${gender}]`).checked = true;
  setMode(trial ? 'trial' : 'sub');
  if (plan) $('#plan').value = plan;
  updateSummary();
  $('#booking').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#name').focus({ preventScroll: true }), 700);
}
document.addEventListener('click', e => {
  const p = e.target.closest('[data-plan]'), g = e.target.closest('[data-gender]');
  if (p) goBooking({ plan: p.dataset.plan });
  if (g) goBooking({ gender: g.dataset.gender });
});
$('#trialBtn').addEventListener('click', () => goBooking({ trial: true }));

function getData() {
  const f = new FormData(form);
  return {
    name: (f.get('name') || '').trim(), phone: (f.get('phone') || '').trim(), gender: f.get('gender'),
    plan: PLANS.find(p => p.id === f.get('plan')), date: f.get('date'), notes: (f.get('notes') || '').trim(), type: mode
  };
}

/* Live summary: updates price whenever the plan/section/type changes */
function updateSummary() {
  const d = getData();
  const rows = d.type === 'trial'
    ? `<dt>النوع</dt><dd>حصة تجريبية</dd><dt>القسم</dt><dd>${GENDER[d.gender] || '—'}</dd><dt>السعر</dt><dd class="total">مجانًا</dd>`
    : `<dt>القسم</dt><dd>${GENDER[d.gender] || '—'}</dd><dt>الباقة</dt><dd>${d.plan ? d.plan.name : '—'}</dd><dt>السعر</dt><dd class="total">${d.plan ? d.plan.price + ' ' + CUR : '—'}</dd>`;
  $('#summary').innerHTML = `<p>ملخص الحجز</p><dl>${rows}</dl>`;
}
form.addEventListener('input', updateSummary);
form.addEventListener('change', updateSummary);

function validate() {
  const d = getData(), errs = {};
  if (d.name.length < 3) errs.name = 'أدخل اسمك الكامل.';
  if (!/^(\+?970|0)?5\d{8}$/.test(d.phone.replace(/[\s-]/g, ''))) errs.phone = 'أدخل رقم جوال صحيح، مثل 0591234567.';
  if (!d.gender) errs.gender = 'اختر القسم: رجال أو سيدات.';
  if (d.type === 'sub' && !d.plan) errs.plan = 'اختر الباقة.';
  if (!d.date || d.date < today) errs.date = 'اختر تاريخًا من اليوم فصاعدًا.';
  $$('.field', form).forEach(f => {
    const c = f.querySelector('[name]'); if (!c) return;
    f.classList.toggle('bad', !!errs[c.name]);
    const s = f.querySelector('.err'); if (s) s.textContent = errs[c.name] || '';
  });
  return { errs, d };
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const { errs, d } = validate();
  if (Object.keys(errs).length) {
    toast(Object.values(errs)[0]);
    const f = form.querySelector('.bad'); f && f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  /* Front-end only: nothing is sent anywhere. Connect a real booking system here later. */
  $('#mBody').innerHTML = `
    <p><b>الاسم:</b> ${esc(d.name)}</p>
    <p><b>الهاتف:</b> <span dir="ltr">${esc(d.phone)}</span></p>
    <p><b>القسم:</b> ${GENDER[d.gender]}</p>
    <p><b>نوع الحجز:</b> ${d.type === 'trial' ? 'حصة تجريبية مجانية' : esc(d.plan.name)}</p>
    <p><b>تاريخ البدء:</b> ${esc(d.date)}</p>
    <p><b>السعر:</b> ${d.type === 'trial' ? 'مجانًا' : d.plan.price + ' ' + CUR}</p>
    ${d.notes ? `<p><b>ملاحظات:</b> ${esc(d.notes)}</p>` : ''}
    <p style="margin-top:.6rem;color:var(--g1)">سنتواصل معك لتأكيد الحجز.</p>`;
  $('#modal').hidden = false; $('#mClose').focus();
  form.reset(); $('#date').value = today; setMode('sub');
  $$('.field', form).forEach(f => f.classList.remove('bad'));
  $$('.err', form).forEach(s => s.textContent = '');
});

function closeModal() { $('#modal').hidden = true; }
$('#mClose').addEventListener('click', closeModal);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

let tt;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200);
}

updateSummary();
