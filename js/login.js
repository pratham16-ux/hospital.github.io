/* ==========================================================================
   Stackly Hospital — Dashboard Suite · login.js  (corrected)
   Role selection, inline validation, loading + success animation and the
   role-based redirect. Session persists via Session (common.js).

   FIX: the auto-redirect now only fires for a genuinely valid, fresh
   session (Session.get() in common.js validates shape + 12 h expiry and
   wipes anything stale). A bfcache guard re-checks on back/forward
   restores instead of trusting the cached page state.
   ========================================================================== */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#loginForm");
  if (!form) return;

  const emailInput  = $("#loginEmail");
  const passInput   = $("#loginPassword");
  const roleCards   = $$(".role-card");
  const roleError   = $("#roleError");
  const signInBtn   = $("#signInBtn");
  const successNote = $("#successNote");

  let selectedRole = null;

  /* Skip the form ONLY for a valid, fresh session — Session.get() already
     clears anything stale, malformed, or left over from old builds. */
  const existing = Session.get();
  if (existing) {
    window.location.replace(`${existing.role}-dashboard.html`);
    return;
  }

  /* bfcache guard — if the browser restores this page from the back/forward
     cache, re-evaluate the session instead of showing a stale state. */
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    const s = Session.get();
    if (s) window.location.replace(`${s.role}-dashboard.html`);
  });

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

  const validateEmail = () => {
    const value = emailInput.value.trim();
    if (!value) return setError(emailInput, "Please enter your email address.");
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
      return setError(emailInput, "Enter a valid email, e.g. name@example.com.");
    return setError(emailInput, "");
  };

  const validatePassword = () => {
    const value = passInput.value;
    if (!value) return setError(passInput, "Please enter your password.");
    if (value.length < 8) return setError(passInput, "Password must be at least 8 characters.");
    return setError(passInput, "");
  };

  const validateRole = () => {
    const ok = Boolean(selectedRole);
    roleError.textContent = ok ? "" : "Please choose Doctor or Patient.";
    roleError.style.display = ok ? "none" : "block";
    return ok;
  };

  emailInput.addEventListener("blur", validateEmail);
  passInput.addEventListener("blur", validatePassword);
  [emailInput, passInput].forEach((input) =>
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) {
        input === emailInput ? validateEmail() : validatePassword();
      }
    })
  );

  /* ---------------- Submit → loading → success → redirect ---------------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const checks = [validateEmail(), validatePassword(), validateRole()];
    if (checks.includes(false)) {
      const firstBad = $(".field.has-error input", form);
      if (firstBad) firstBad.focus();
      return;
    }

    signInBtn.classList.add("is-loading");

    // Simulated auth round-trip, then persist and hand over to the dashboard.
    setTimeout(() => {
      Session.save(emailInput.value.trim(), selectedRole);

      signInBtn.classList.remove("is-loading");
      successNote.textContent =
        selectedRole === "doctor"
          ? "Opening your clinical console…"
          : "Opening your health hub…";
      $("#loginSuccess").classList.add("is-visible");

      setTimeout(() => {
        window.location.href = `${selectedRole}-dashboard.html`;
      }, 1200);
    }, 900);
  });

  /* ---------------- Forgot password (inline, no alert) ------------------- */
  $("#forgotLink").addEventListener("click", (e) => {
    e.preventDefault();
    openModal({
      title: "Reset your password",
      sub: "We'll send a reset link to your registered email.",
      body: `
        <div class="field">
          <label for="fpEmail">Email address</label>
          <input type="email" id="fpEmail" placeholder="you@example.com">
          <span class="field-error" role="alert"></span>
        </div>`,
      actions: [
        { label: "Cancel", cls: "btn--ghost", onClick: closeModal },
        {
          label: "Send reset link",
          cls: "btn--primary",
          onClick: () => {
            const input = $("#fpEmail");
            const value = input.value.trim();
            const field = input.closest(".field");
            const err   = field.querySelector(".field-error");
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
              field.classList.add("has-error");
              err.textContent = "Enter a valid email address.";
              return;
            }
            closeModal();
            showToast("Reset link sent — check your inbox.");
          },
        },
      ],
    });
  });
});