/* ==========================================================================
   Stackly Hospital — Dashboard Suite · common.js
   Shared utilities for login + both dashboards: DOM helpers, Session
   (sessionStorage — NOT localStorage), role guard, theme, hash router,
   sidebar drawer, modal, toast, counters, clock, scroll reveal,
   downloads and formatters.

   Aligned to the project CSS:
   · Modal   → .modal > .modal__card / __head / __body / __foot (stylee.css)
   · Toast   → .toast.is-visible with an icon svg (stylee.css)
   · Reveal  → .is-inview on [data-reveal] and .stagger (animations.css)
   · Drawer  → .sidebar.is-open + .sidebar-veil.is-visible (responsive.css)
   ========================================================================== */
(() => {
"use strict";
console.info("%cStackly common.js v2 (IIFE + window exports) loaded", "color:#0E7490;font-weight:bold");

/* --------------------------------------------------------------------------
   0. Config
   -------------------------------------------------------------------------- */
const LOGIN_PAGE         = "login.html";
const SESSION_KEY        = "stacklySession";
const THEME_KEY          = "stacklyTheme";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;    // 12 hours

/* One-time cleanup — remove auth data an older build left in localStorage,
   which is what caused the "dashboard opens before login" bug. */
["stacklySession", "stacklyUserSession", "stacklyAuth", "stacklyLogin"].forEach((key) => {
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
});

/* --------------------------------------------------------------------------
   1. DOM helpers + formatters
   -------------------------------------------------------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const escapeHtml = (str = "") =>
  String(str).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const fmtINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------------------
   2. Session — sessionStorage only, validated on every read
   -------------------------------------------------------------------------- */
const Session = {
  save(email, role) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      email,
      role,
      loginTime: new Date().toISOString(),
    }));
  },

  /** Returns the session ONLY if it's well-formed and fresh; otherwise wipes it. */
  get() {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { /* corrupted JSON — treated as no session */ }

    if (s) {
      const roleOk  = s.role === "doctor" || s.role === "patient";
      const emailOk = typeof s.email === "string" && s.email.includes("@");
      const time    = Date.parse(s.loginTime);
      const fresh   = Number.isFinite(time) && Date.now() - time < SESSION_MAX_AGE_MS;
      if (roleOk && emailOk && fresh) return s;
    }
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  },

  clear() {
    sessionStorage.removeItem(SESSION_KEY);
  },
};

/**
 * Dashboard gatekeeper — call at the top of doctor.js / patient.js.
 * Redirects to the login page unless a valid session with the exact
 * role exists. Returns the session (or null after redirecting).
 */
function requireRole(role) {
  const s = Session.get();
  if (!s || s.role !== role) {
    Session.clear();
    window.location.replace(LOGIN_PAGE);
    return null;
  }
  return s;
}

/* Logout — clears the session BEFORE navigating, replace() keeps the
   dashboard out of history so Back can't return to it. */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-logout]");
  if (!btn) return;
  Session.clear();
  window.location.replace(LOGIN_PAGE);
});

/* bfcache guard — a dashboard restored from the back/forward cache after
   logout gets kicked back to login instead of showing stale data. */
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  closeSidebar();                                   // never restore with the drawer open
  if (document.querySelector(".app") && !Session.get()) {
    window.location.replace(LOGIN_PAGE);
  }
});

/* --------------------------------------------------------------------------
   3. Theme — display preference only, so localStorage is fine here
   -------------------------------------------------------------------------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
}

(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
  if (saved === "dark" || saved === "light") {
    document.documentElement.setAttribute("data-theme", saved);
  }
})();

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-theme-toggle]")) toggleTheme();
});

/* --------------------------------------------------------------------------
   4. Hash router — [data-view-panel] sections + [data-view] triggers
   -------------------------------------------------------------------------- */
function setView(view) {
  const panels = $$("[data-view-panel]");
  if (!panels.length) return;

  if (!panels.some((p) => p.dataset.viewPanel === view)) {
    view = panels[0].dataset.viewPanel;
  }

  panels.forEach((p) =>
    p.classList.toggle("is-active", p.dataset.viewPanel === view));

  $$(".side-link[data-view]").forEach((link) =>
    link.classList.toggle("is-active", link.dataset.view === view));

  closeSidebar();
  window.scrollTo({ top: 0 });

  document.dispatchEvent(new CustomEvent("viewchange", { detail: { view } }));
}

function initRouter(defaultView = "dashboard") {
  const apply = () => setView(window.location.hash.slice(1) || defaultView);

  window.addEventListener("hashchange", apply);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn || !btn.dataset.view) return;
    const target = btn.dataset.view;
    if (window.location.hash.slice(1) === target) setView(target); // same hash → no event fires
    else window.location.hash = target;
  });

  apply();
}

/* --------------------------------------------------------------------------
   5. Mobile sidebar drawer (burger + veil) — CSS in responsive.css
   -------------------------------------------------------------------------- */
function openSidebar() {
  $(".sidebar")?.classList.add("is-open");
  $(".sidebar-veil")?.classList.add("is-visible");
  document.body.classList.add("no-scroll");
}
function closeSidebar() {
  $(".sidebar")?.classList.remove("is-open");
  $(".sidebar-veil")?.classList.remove("is-visible");
  if (!modalEl || !modalEl.classList.contains("is-open")) {
    document.body.classList.remove("no-scroll");
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".topbar__burger")) {
    $(".sidebar")?.classList.contains("is-open") ? closeSidebar() : openSidebar();
  }
  if (e.target.closest(".sidebar-veil")) closeSidebar();
});

/* --------------------------------------------------------------------------
   6. Modal — markup matches stylee.css (.modal > .modal__card …)
   -------------------------------------------------------------------------- */
let modalEl = null;
let lastFocused = null;

function ensureModal() {
  if (modalEl) return modalEl;
  modalEl = document.createElement("div");
  modalEl.className = "modal";
  modalEl.innerHTML = `
    <div class="modal__card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal__head">
        <div>
          <h3 id="modalTitle"></h3>
          <p data-modal-sub></p>
        </div>
        <button class="modal__close" type="button" aria-label="Close dialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
      <div class="modal__body"></div>
      <div class="modal__foot"></div>
    </div>`;
  document.body.appendChild(modalEl);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl || e.target.closest(".modal__close")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("is-open")) closeModal();
  });
  return modalEl;
}

function openModal({ title = "", sub = "", body = "", actions = [] }) {
  const root = ensureModal();
  lastFocused = document.activeElement;

  $("#modalTitle", root).textContent = title;
  const subEl = $("[data-modal-sub]", root);
  subEl.textContent = sub;
  subEl.hidden = !sub;
  $(".modal__body", root).innerHTML = body;

  const foot = $(".modal__foot", root);
  foot.innerHTML = "";
  actions.forEach(({ label, cls = "btn--ghost", onClick }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn ${cls}`;
    btn.innerHTML = `<span class="btn__label">${escapeHtml(label)}</span>`;
    btn.addEventListener("click", () => onClick?.());
    foot.appendChild(btn);
  });

  root.classList.add("is-open");
  document.body.classList.add("no-scroll");

  const focusTarget =
    $("input, select, textarea", $(".modal__body", root)) || $(".modal__foot .btn", root);
  setTimeout(() => focusTarget?.focus(), 60);
}

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  lastFocused?.focus?.();
}

/* --------------------------------------------------------------------------
   7. Toast — matches stylee.css (.toast > svg + text)
   -------------------------------------------------------------------------- */
let toastEl = null;
let toastTimer = null;

function showToast(message, isError = false) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/></svg>
      <span data-toast-msg></span>`;
    document.body.appendChild(toastEl);
  }
  $("[data-toast-msg]", toastEl).textContent = message;
  toastEl.classList.toggle("toast--error", isError);

  /* restart the slide-in even for back-to-back toasts */
  toastEl.classList.remove("is-visible");
  void toastEl.offsetWidth;
  toastEl.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 3200);
}

/* --------------------------------------------------------------------------
   8. Scroll reveal — adds .is-inview (animations.css) to [data-reveal]
      and .stagger elements. Inline-style fallback guarantees visibility
      even if a class name ever drifts again.
   -------------------------------------------------------------------------- */
(function initReveal() {
  const items = $$("[data-reveal], .stagger");
  if (!items.length) return;

  const reveal = (el) => {
    el.classList.add("is-inview");
    if (el.matches("[data-reveal]")) {
      el.style.opacity = "1";
      el.style.transform = "none";
    }
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach(reveal);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((el) => io.observe(el));

  /* Views hidden behind the router (display:none) never intersect until
     shown — re-check whenever the view changes. */
  document.addEventListener("viewchange", () => {
    $$("[data-reveal], .stagger").forEach((el) => {
      if (!el.classList.contains("is-inview") && el.offsetParent !== null) reveal(el);
    });
  });

  /* Safety net — nothing may stay hidden past 1.5 s on first paint. */
  setTimeout(() => {
    items.forEach((el) => { if (el.offsetParent !== null) reveal(el); });
  }, 1500);
})();

/* --------------------------------------------------------------------------
   9. Animated counters — <span data-count="42">0</span>
   -------------------------------------------------------------------------- */
function initCounters(scope = document) {
  $$("[data-count]", scope).forEach((el) => {
    const target = Number(el.dataset.count) || 0;

    if (prefersReducedMotion) { el.textContent = target; return; }

    const duration = 700;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));   /* ease-out cubic */
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* --------------------------------------------------------------------------
   10. Topbar clock
   -------------------------------------------------------------------------- */
(function initClock() {
  const timeEl = $("[data-clock-time]");
  const dateEl = $("[data-clock-date]");
  if (!timeEl && !dateEl) return;

  const update = () => {
    const now = new Date();
    if (timeEl) timeEl.textContent = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (dateEl) dateEl.textContent = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
  };
  update();
  setInterval(update, 30 * 1000);
})();

/* --------------------------------------------------------------------------
   11. File download helper
   -------------------------------------------------------------------------- */
function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/* --------------------------------------------------------------------------
   Public API — everything login.js / signup.js / patient.js / doctor.js use.
   Assigned to window (not top-level const) so this file can coexist with
   script.js / animations.js on the same page without identifier collisions.
   -------------------------------------------------------------------------- */
Object.assign(window, {
  $, $$, escapeHtml, cssVar, fmtINR, prefersReducedMotion,
  Session, requireRole,
  applyTheme, toggleTheme,
  setView, initRouter, openSidebar, closeSidebar,
  openModal, closeModal, showToast,
  initCounters, downloadFile,
});
})();