/* ==========================================================================
   Stackly Hospital — Dashboard Suite · signup.js
   Registration form: inline validation (name, email, Indian mobile,
   password rules, confirm, role, terms), loading + success animation,
   then a redirect to login.html so the new user signs in.
   Requires common.js.
   ========================================================================== */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#signupForm");
  if (!form) return;

  const nameInput    = $("#suName");
  const emailInput   = $("#suEmail");
  const phoneInput   = $("#suPhone");
  const passInput    = $("#suPassword");
  const confirmInput = $("#suConfirm");
  const roleCards    = $$(".role-card");
  const roleError    = $("#roleError");
  const termsCheck   = $("#termsCheck");
  const termsError   = $("#termsError");
  const createBtn    = $("#createBtn");

  let selectedRole = null;

  /* Already signed in? Go straight to the dashboard — no need to register. */
  const existing = Session.get();
  if (existing) {
    window.location.replace(`${existing.role}-dashboard.html`);
    return;
  }

  /* ---------------- Role cards — single-select radios ------------------- */
  roleCards.forEach((card) =>
    card.addEventListener("click", () => {
      roleCards.forEach((c) => {
        c.classList.remove("is-selected");
        c.setAttribute("aria-checked", "false");
      });
      card.classList.add("is-selected");
      card.setAttribute("aria-checked", "true");
      selectedRole = card.dataset.role;
      roleError.style.display = "none";
    })
  );

  /* ---------------- Field validation ------------------------------------ */
  const setError = (input, message) => {
    const field = input.closest(".field");
    const errEl = field.querySelector(".field-error");
    field.classList.toggle("has-error", Boolean(message));
    errEl.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  };

  const validateName = () => {
    const value = nameInput.value.trim();
    if (!value) return setError(nameInput, "Please enter your full name.");
    if (!/^[A-Za-z ]+$/.test(value))
      return setError(nameInput, "Letters and spaces only — no numbers or symbols.");
    if (value.length > 16)
      return setError(nameInput, "Name can be at most 16 characters.");
    return setError(nameInput, "");
  };

  const validateEmail = () => {
    const value = emailInput.value.trim();
    if (!value) return setError(emailInput, "Please enter your email address.");
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
      return setError(emailInput, "Enter a valid email, e.g. name@example.com.");
    return setError(emailInput, "");
  };

  const validatePhone = () => {
    const value = phoneInput.value.trim();
    if (!value) return setError(phoneInput, "Please enter your mobile number.");
    if (!/^[6-9]\d{9}$/.test(value))
      return setError(phoneInput, "Enter a valid 10-digit mobile starting 6–9.");
    return setError(phoneInput, "");
  };

  const validatePassword = () => {
    const value = passInput.value;
    if (!value) return setError(passInput, "Please choose a password.");
    if (value.length < 8) return setError(passInput, "Minimum 8 characters.");
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
      return setError(passInput, "Use letters and at least one number.");
    return setError(passInput, "");
  };

  const validateConfirm = () => {
    const value = confirmInput.value;
    if (!value) return setError(confirmInput, "Please re-enter your password.");
    if (value !== passInput.value)
      return setError(confirmInput, "Passwords do not match.");
    return setError(confirmInput, "");
  };

  const validateRole = () => {
    const ok = Boolean(selectedRole);
    roleError.textContent = ok ? "" : "Please choose Doctor or Patient.";
    roleError.style.display = ok ? "none" : "block";
    return ok;
  };

  const validateTerms = () => {
    const ok = termsCheck.checked;
    termsError.textContent = ok ? "" : "Please accept the Terms & Privacy Policy.";
    termsError.style.display = ok ? "none" : "block";
    return ok;
  };

  /* Keep the mobile field digits-only as the user types */
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  const fields = [
    [nameInput, validateName],
    [emailInput, validateEmail],
    [phoneInput, validatePhone],
    [passInput, validatePassword],
    [confirmInput, validateConfirm],
  ];

  fields.forEach(([input, validate]) => {
    input.addEventListener("blur", validate);
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) validate();
    });
  });

  termsCheck.addEventListener("change", () => {
    if (termsCheck.checked) termsError.style.display = "none";
  });

  /* ---------------- Submit → loading → success → login.html -------------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const checks = [
      validateName(), validateEmail(), validatePhone(),
      validatePassword(), validateConfirm(), validateRole(), validateTerms(),
    ];
    if (checks.includes(false)) {
      const firstBad = $(".field.has-error input", form);
      if (firstBad) firstBad.focus();
      return;
    }

    createBtn.classList.add("is-loading");

    // Simulated registration round-trip. No Session.save() here — the new
    // user must sign in with their credentials on login.html.
    setTimeout(() => {
      createBtn.classList.remove("is-loading");
      $("#successNote").textContent =
        selectedRole === "doctor"
          ? "Doctor account created — taking you to sign in…"
          : "Patient account created — taking you to sign in…";
      $("#signupSuccess").classList.add("is-visible");
      showToast("Account created! Please sign in.");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1400);
    }, 900);
  });
});