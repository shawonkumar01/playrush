/**
 * PlayRush - About Page Contact Form Handler
 * Handles Formspree submission, client-side validation, duplicate prevention, and honeypot protection.
 */

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  const btnSubmit = document.getElementById('btnSubmitContact');
  const successBanner = document.getElementById('formSuccessBanner');
  const errorBanner = document.getElementById('formErrorBanner');
  const errorMsgEl = document.getElementById('formErrorMsg');

  let isSubmitting = false;

  if (contactForm && btnSubmit) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Prevent duplicate submission while request is in-flight
      if (isSubmitting) return;

      const nameInput = document.getElementById('contactName');
      const emailInput = document.getElementById('contactEmail');
      const subjectInput = document.getElementById('contactSubject');
      const messageInput = document.getElementById('contactMessage');

      const nameErr = document.getElementById('nameError');
      const emailErr = document.getElementById('emailError');
      const subjectErr = document.getElementById('subjectError');
      const messageErr = document.getElementById('messageError');

      nameErr.textContent = '';
      emailErr.textContent = '';
      if (subjectErr) subjectErr.textContent = '';
      messageErr.textContent = '';

      // Client-side field validations
      let isValid = true;

      if (!nameInput.value.trim()) {
        nameErr.textContent = 'Please enter your name.';
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        emailErr.textContent = 'Please enter a valid email address.';
        isValid = false;
      }

      if (!subjectInput.value.trim()) {
        if (subjectErr) subjectErr.textContent = 'Please select a subject.';
        isValid = false;
      }

      const trimmedMsg = messageInput.value.trim();
      if (!trimmedMsg || trimmedMsg.length < 10) {
        messageErr.textContent = 'Please enter a message with at least 10 characters.';
        isValid = false;
      } else if (trimmedMsg.length > 3000) {
        messageErr.textContent = 'Message exceeds the 3,000 character limit.';
        isValid = false;
      }

      if (!isValid) return;

      // Begin Formspree Submission
      isSubmitting = true;
      btnSubmit.disabled = true;
      const originalBtnHTML = btnSubmit.innerHTML;

      // Visual loading state
      btnSubmit.innerHTML = `
        <svg class="btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        <span>SENDING...</span>
      `;

      // Reset existing status banners
      successBanner.style.display = 'none';
      errorBanner.style.display = 'none';

      const formData = new FormData(contactForm);

      try {
        const response = await fetch('https://formspree.io/f/xwlolboj', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        let submissionSucceeded = false;

        if (response.ok) {
          // Confirmed successful delivery by Formspree
          submissionSucceeded = true;
          successBanner.style.display = 'flex';
          errorBanner.style.display = 'none';
          contactForm.reset();

          if (typeof showToast === 'function') {
            showToast('✓ Message sent successfully! Thank you for contacting PlayRush.');
          }

          setTimeout(() => {
            successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);

          // 15-second spam prevention cooldown on submit button
          btnSubmit.disabled = true;
          let cooldownSeconds = 15;
          btnSubmit.innerHTML = `<span>SENT (COOLDOWN ${cooldownSeconds}s)</span>`;
          const cooldownInterval = setInterval(() => {
            cooldownSeconds--;
            if (cooldownSeconds <= 0) {
              clearInterval(cooldownInterval);
              btnSubmit.disabled = false;
              btnSubmit.innerHTML = originalBtnHTML;
              isSubmitting = false;
            } else {
              btnSubmit.innerHTML = `<span>SENT (COOLDOWN ${cooldownSeconds}s)</span>`;
            }
          }, 1000);
        } else {
          // Server rejected submission
          const data = await response.json().catch(() => null);
          let customError = 'Submission failed. Please check your details and try again, or email contact.playrush@gmail.com directly.';
          if (data && data.errors && data.errors.length) {
            customError = data.errors.map(err => err.message).join('. ');
          }

          if (errorMsgEl) errorMsgEl.textContent = customError;
          errorBanner.style.display = 'flex';
          successBanner.style.display = 'none';

          if (typeof showToast === 'function') {
            showToast('✕ Submission error. Please try again.');
          }

          setTimeout(() => {
            errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      } catch (err) {
        // Network connection error
        if (errorMsgEl) {
          errorMsgEl.textContent = 'Network error: Unable to reach the contact server. Please check your internet connection or email us directly at contact.playrush@gmail.com.';
        }
        errorBanner.style.display = 'flex';
        successBanner.style.display = 'none';

        if (typeof showToast === 'function') {
          showToast('✕ Network error. Please check your connection.');
        }

        setTimeout(() => {
          errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } finally {
        if (!submissionSucceeded) {
          isSubmitting = false;
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalBtnHTML;
        }
      }
    });
  }
});
