/* ==========================================================================
   Stackly Hospital & Clinic — Core interactions
   Navigation, theme, appointment modal, form validation, FAQ,
   doctor search & filters, testimonial slider, toast system.
   Author: Stackly Frontend Team (SNAB Solutions)
   ========================================================================== */
"use strict";

/* Tiny query helpers ------------------------------------------------------ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* --------------------------------------------------------------------------
   1. Header — shrink on scroll
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = $(".site-header");
  if (!header) return;

  const onScroll = () => header.classList.toggle("is-shrunk", window.scrollY > 60);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------------
   2. Mobile navigation
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const burger = $(".hamburger");
  const menu   = $(".mobile-menu");
  if (!burger || !menu) return;

  const setState = (open) => {
    burger.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  burger.addEventListener("click", () =>
    setState(!menu.classList.contains("is-open"))
  );

  // Close the panel when a destination is chosen
  $$("a", menu).forEach((link) =>
    link.addEventListener("click", () => setState(false))
  );

  // Restore state when returning via bfcache (browser back button)
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) setState(false);
  });
}

/* --------------------------------------------------------------------------
   3. Theme toggle (light / dark) — persisted in sessionStorage
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const saved = sessionStorage.getItem("stacklyHospitalTheme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);

  $$(".theme-toggle").forEach((btn) =>
    btn.addEventListener("click", () => {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      document.documentElement.setAttribute("data-theme", next);
      sessionStorage.setItem("stacklyHospitalTheme", next);
    })
  );
}

/* --------------------------------------------------------------------------
   4. Toast notifications
   -------------------------------------------------------------------------- */
let toastTimer = null;

function showToast(message, isError = false) {
  let toast = $(".toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.innerHTML =
      '<svg class="ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 4.5-5.5"/></svg><span></span>';
    document.body.appendChild(toast);
  }

  toast.classList.toggle("toast--error", isError);
  $("span", toast).textContent = message;

  clearTimeout(toastTimer);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4200);
}

/* --------------------------------------------------------------------------
   5. Appointment modal
   -------------------------------------------------------------------------- */
function initModal() {
  const modal = $("#appointmentModal");
  if (!modal) return;

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const first = $("input, select", modal);
    if (first) setTimeout(() => first.focus(), 250);
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  $$("[data-open-appointment]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    })
  );

  $$("[data-close-modal]", modal).forEach((btn) =>
    btn.addEventListener("click", close)
  );

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
}

/* --------------------------------------------------------------------------
   6. Form validation
   Rules follow hospital front-desk requirements:
   — names: letters and spaces only, max 16 characters
   — phone: 10-digit Indian mobile starting 6–9
   — email: strict pattern
   -------------------------------------------------------------------------- */
const VALIDATORS = {
  name(value) {
    if (!value.trim()) return "Please enter your name.";
    if (!/^[A-Za-z ]+$/.test(value.trim()))
      return "Name can contain letters and spaces only.";
    if (value.trim().length > 16) return "Name must be 16 characters or fewer.";
    return "";
  },
  phone(value) {
    if (!value.trim()) return "Please enter your mobile number.";
    if (!/^[6-9]\d{9}$/.test(value.trim()))
      return "Enter a valid 10-digit mobile number starting with 6–9.";
    return "";
  },
  email(value) {
    if (!value.trim()) return "Please enter your email address.";
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim()))
      return "Enter a valid email address, e.g. name@example.com.";
    return "";
  },
  required(value) {
    return value.trim() ? "" : "This field is required.";
  },
  password(value) {
    if (!value) return "Please create a password.";
    if (value.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
      return "Use letters and at least one number.";
    return "";
  },
  confirm(value, input) {
    if (!value) return "Please re-enter your password.";
    const target = document.querySelector(input.dataset.match || "");
    if (target && value !== target.value) return "Passwords do not match.";
    return "";
  },
  date(value) {
    if (!value) return "Please choose a preferred date.";
    const chosen = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chosen < today) return "Appointment date cannot be in the past.";
    return "";
  },
};

function validateField(input) {
  const rule = input.dataset.validate;
  if (!rule || !VALIDATORS[rule]) return true;

  const message = VALIDATORS[rule](input.value, input);
  const field = input.closest(".field");
  const errEl = field ? field.querySelector(".field-error") : null;

  if (field) field.classList.toggle("has-error", Boolean(message));
  if (errEl) errEl.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");

  return !message;
}

function initForms() {
  $$("form[data-validate-form]").forEach((form) => {
    const inputs = $$("[data-validate]", form);

    // Validate as the user leaves each field; clear errors while typing
    inputs.forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (field && field.classList.contains("has-error")) validateField(input);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const allValid = inputs.map(validateField).every(Boolean);

      if (!allValid) {
        const firstBad = $(".field.has-error input, .field.has-error select, .field.has-error textarea", form);
        if (firstBad) firstBad.focus();
        showToast("Please correct the highlighted fields.", true);
        return;
      }

      const success = form.dataset.successMessage || "Thank you — we have received your request.";

      // Sign-up: create a lightweight session before the form is cleared,
      // then hand over to the homepage.
      if (form.id === "signupForm") {
        const session = {
          name:  ($("#suName", form)  || {}).value || "",
          email: ($("#suEmail", form) || {}).value || "",
          phone: ($("#suPhone", form) || {}).value || "",
          role:  "patient",
          createdAt: Date.now(),
        };
        sessionStorage.setItem("stacklyHospitalAuth", JSON.stringify(session));
        form.reset();
        showToast(success);
        setTimeout(() => { window.location.href = "index.html"; }, 1400);
        return;
      }

      form.reset();
      showToast(success);

      // If the form lives inside the appointment modal, close it politely
      const modal = form.closest(".modal");
      if (modal) {
        setTimeout(() => {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        }, 600);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   7. FAQ accordion
   -------------------------------------------------------------------------- */
function initFaq() {
  $$(".faq-item").forEach((item) => {
    const trigger = $(".faq-q", item);
    const answer = $(".faq-a", item);
    if (!trigger || !answer) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // One open answer at a time keeps the list scannable
      $$(".faq-item.is-open").forEach((openItem) => {
        openItem.classList.remove("is-open");
        $(".faq-a", openItem).style.maxHeight = null;
        $(".faq-q", openItem).setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   8. Doctors page — live search + department filter
   -------------------------------------------------------------------------- */
function initDoctorFilters() {
  const grid = $("#doctorGrid");
  if (!grid) return;

  const cards   = $$(".doc-card", grid);
  const search  = $("#doctorSearch");
  const chips   = $$(".filter-chips .chip");
  const empty   = $("#doctorEmpty");
  let activeDept = "all";

  const applyFilters = () => {
    const term = (search ? search.value : "").trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const dept = card.dataset.dept || "";
      const haystack = (card.dataset.search || card.textContent).toLowerCase();
      const matchesDept = activeDept === "all" || dept === activeDept;
      const matchesTerm = !term || haystack.includes(term);
      const show = matchesDept && matchesTerm;

      card.style.display = show ? "" : "none";
      if (show) visible++;
    });

    if (empty) empty.classList.toggle("is-visible", visible === 0);
  };

  if (search) search.addEventListener("input", applyFilters);

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeDept = chip.dataset.filter || "all";
      applyFilters();
    })
  );
}

/* --------------------------------------------------------------------------
   9. Testimonial slider (native scroll-snap + arrow controls)
   -------------------------------------------------------------------------- */
function initTestimonials() {
  const track = $(".testi-track");
  if (!track) return;

  const step = () => {
    const card = $(".testi-card", track);
    return card ? card.offsetWidth + 26 : 320;
  };

  const prev = $("[data-testi-prev]");
  const next = $("[data-testi-next]");

  if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  if (next) next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
}

/* --------------------------------------------------------------------------
   10. Card spotlight — feeds cursor position into --mx / --my
   -------------------------------------------------------------------------- */
function initSpotlightCards() {
  $$(".dept-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   11. Button ripple
   -------------------------------------------------------------------------- */
function initRipples() {
  $$(".btn--primary, .btn--light").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");

      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top  = `${e.clientY - rect.top - size / 2}px`;

      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });
}

/* --------------------------------------------------------------------------
   12. Back to top
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const btn = $(".to-top");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => btn.classList.toggle("is-visible", window.scrollY > 700),
    { passive: true }
  );

  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}

/* --------------------------------------------------------------------------
   13. Gallery lightbox
   -------------------------------------------------------------------------- */
function initLightbox() {
  const figures = $$(".gallery-grid figure");
  if (!figures.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-label", "Image preview");
  lightbox.innerHTML =
    '<button class="modal-close" aria-label="Close preview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button><img alt="">';
  document.body.appendChild(lightbox);

  const img = $("img", lightbox);
  const close = () => lightbox.classList.remove("is-open");

  figures.forEach((figure) =>
    figure.addEventListener("click", () => {
      const source = $("img", figure);
      img.src = source.src;
      img.alt = source.alt;
      lightbox.classList.add("is-open");
    })
  );

  $(".modal-close", lightbox).addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileMenu();
  initThemeToggle();
  initModal();
  initForms();
  initFaq();
  initDoctorFilters();
  initTestimonials();
  initSpotlightCards();
  initRipples();
  initBackToTop();
  initLightbox();
});