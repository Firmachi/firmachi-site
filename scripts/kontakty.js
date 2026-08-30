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

const submitButton = form?.querySelector('button[type="submit"]');
const submitLabel = submitButton?.querySelector('.beam__label');
const idleLabel = submitLabel?.textContent;

/* Without this the button stays live through the whole request and a second
   click sends the brief twice. */
function setSubmitting(busy) {
  if (!submitButton) return;
  submitButton.disabled = busy;
  submitButton.setAttribute('aria-busy', String(busy));
  if (submitLabel) submitLabel.textContent = busy ? 'Отправляем…' : idleLabel;
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (submitButton?.disabled) return;
  if (formError) formError.hidden = true;
  setSubmitting(true);

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
      /* The form the visitor was looking at is gone, so send focus to what
         replaced it instead of leaving it on a detached button. */
      successPanel.focus();
    })
    .catch((error) => {
      console.error('Contact form submission failed:', error);
      setSubmitting(false);
      if (formError) formError.hidden = false;
    });
});
