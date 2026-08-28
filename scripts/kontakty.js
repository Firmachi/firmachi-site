/* Contact page: project-type chip picker + Netlify Forms AJAX submit.

   The chips write their value into a hidden input so a plain (JS-free) form
   post still carries the selection. Submission itself intercepts the native
   post and re-sends it as an AJAX request to Netlify's form endpoint, then
   swaps in the same "Заявка отправлена" panel the reference design uses —
   without a full-page navigation. */

const chips = Array.from(document.querySelectorAll('[data-chip]'));
const typeInput = document.querySelector('[data-project-type]');

function setActiveChip(target) {
  chips.forEach((chip) => {
    const active = chip === target;
    chip.classList.toggle('chip--active', active);
    chip.setAttribute('aria-pressed', String(active));
  });
  if (typeInput) typeInput.value = target.dataset.chip;
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => setActiveChip(chip));
  chip.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveChip(chip);
    }
  });
});

const form = document.querySelector('[data-contact-form]');
const formPanel = document.querySelector('[data-form-panel]');
const successPanel = document.querySelector('[data-success-panel]');
const formError = document.querySelector('[data-form-error]');

function encode(data) {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (formError) formError.hidden = true;

  const data = Object.fromEntries(new FormData(form).entries());

  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encode(data),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Netlify Forms responded ${response.status}`);
      formPanel.hidden = true;
      successPanel.hidden = false;
    })
    .catch((error) => {
      console.error('Contact form submission failed:', error);
      if (formError) formError.hidden = false;
    });
});
