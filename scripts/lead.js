/* Lead source tracking and the contact form.
   1. Remembers where the visitor came from (UTM tags, ad click ids, referrer, first page) for 90 days.
   2. Pre-fills WhatsApp links with "Пишу с сайта firmachi.kz (service)", so the CRM marks the chat as a site lead.
   3. Sends the contact form to the CRM together with that attribution. */
(() => {
  const CRM_LEADS = 'https://crm.firmachi.kz/api/leads';
  const KEY = 'fm_attr';
  const TTL = 90 * 864e5;
  const lang = (document.documentElement.lang || 'ru').slice(0, 2);

  const store = {
    get() {
      try {
        const v = JSON.parse(localStorage.getItem(KEY) || 'null');
        return v && Date.now() - v.ts < TTL ? v : null;
      } catch { return null; }
    },
    set(v) {
      try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ }
    },
  };

  /* ---- 1. attribution: a new ad / UTM click replaces the old one, otherwise first visit wins ---- */
  const params = new URLSearchParams(location.search);
  const TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'yclid'];
  const fromUrl = {};
  TAGS.forEach((k) => { const v = params.get(k); if (v) fromUrl[k] = v.slice(0, 200); });
  let ref = '';
  try { ref = document.referrer && new URL(document.referrer).hostname.endsWith('firmachi.kz') ? '' : document.referrer; } catch { /* bad referrer */ }

  if (Object.keys(fromUrl).length || !store.get()) {
    store.set({ ...fromUrl, referrer: ref.slice(0, 500), landing: location.pathname, ts: Date.now() });
  }

  /* ---- 2. WhatsApp links ---- */
  const SERVICES = {
    'reklamnye-roliki': { ru: 'Рекламные ролики', kk: 'Жарнамалық роликтер', en: 'Commercials' },
    'reels-tiktok': { ru: 'Reels и TikTok', kk: 'Reels және TikTok', en: 'Reels and TikTok' },
    'branded-content': { ru: 'Branded content', kk: 'Branded content', en: 'Branded content' },
    'prodyusirovanie': { ru: 'Продюсирование', kk: 'Продюсерлеу', en: 'Production services' },
    'postprodakshen': { ru: 'Постпродакшен', kk: 'Постпродакшн', en: 'Post-production' },
    'ai-production': { ru: 'AI production', kk: 'AI production', en: 'AI production' },
  };
  const GREETING = {
    ru: 'Здравствуйте! Пишу с сайта firmachi.kz',
    kk: 'Сәлеметсіз бе! firmachi.kz сайтынан жазып отырмын',
    en: "Hello! I'm writing from the firmachi.kz website",
  };
  const slug = (location.pathname.match(/\/uslugi\/([a-z-]+)/) || [])[1];
  const service = slug && SERVICES[slug] ? SERVICES[slug][lang] || SERVICES[slug].ru : '';
  const waText = (GREETING[lang] || GREETING.ru) + (service ? ` (${service})` : '');

  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
    const url = new URL(a.href);
    if (!url.searchParams.has('text')) url.searchParams.set('text', waText);
    a.href = url.toString();
    a.addEventListener('click', () => {
      if (typeof gtag === 'function') gtag('event', 'whatsapp_click', { page_path: location.pathname });
    });
  });

  /* ---- 3. contact form ---- */
  const TEXT = {
    ru: { sending: 'Отправляем…', ok: 'Спасибо! Продюсер напишет вам в WhatsApp в течение рабочего дня.', fail: 'Не получилось отправить. Напишите нам в WhatsApp или на hi@firmachi.kz.', phone: 'Укажите номер с кодом страны, например +7 701 123 45 67.' },
    kk: { sending: 'Жіберіп жатырмыз…', ok: 'Рақмет! Продюсер жұмыс күні ішінде WhatsApp-қа жазады.', fail: 'Жіберу мүмкін болмады. WhatsApp-қа немесе hi@firmachi.kz поштасына жазыңыз.', phone: 'Нөмірді ел кодымен көрсетіңіз, мысалы +7 701 123 45 67.' },
    en: { sending: 'Sending…', ok: 'Thank you! A producer will message you on WhatsApp within one working day.', fail: "Couldn't send the form. Please message us on WhatsApp or at hi@firmachi.kz.", phone: 'Please enter the number with the country code, e.g. +7 701 123 45 67.' },
  };
  const t = TEXT[lang] || TEXT.ru;

  document.querySelectorAll('form[data-lead-form]').forEach((form) => {
    const status = form.querySelector('[data-lead-status]');
    const button = form.querySelector('button[type="submit"]');
    const say = (msg, kind) => { status.textContent = msg; status.dataset.kind = kind || ''; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const digits = String(f.phone || '').replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) { say(t.phone, 'error'); form.phone.focus(); return; }

      const a = store.get() || {};
      const attribution = { page: location.pathname };
      [...TAGS, 'referrer', 'landing'].forEach((k) => { if (a[k]) attribution[k] = String(a[k]); });

      button.disabled = true;
      say(t.sending);
      try {
        const res = await fetch(CRM_LEADS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: f.name, phone: f.phone, company: f.company || undefined,
            service: f.service || undefined, message: f.message || undefined,
            website: f.website || undefined, attribution,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        say(t.ok, 'ok');
        if (typeof gtag === 'function') gtag('event', 'generate_lead', { form: 'contact', service: f.service || '' });
      } catch {
        say(t.fail, 'error');
      } finally {
        button.disabled = false;
      }
    });
  });
})();
