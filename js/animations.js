/* ==========================================================================
   Stackly Hospital & Clinic — Motion layer
   Preloader, scroll progress, reveal observer, number counters,
   image tilt, hero parallax, page transitions.
   Kept separate from script.js so behaviour and motion stay decoupled.
   ========================================================================== */
"use strict";

const PREFERS_REDUCED_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* --------------------------------------------------------------------------
   1. Preloader — ECG pulse draws once, then the page fades in
   -------------------------------------------------------------------------- */
function initPreloader() {
  const loader = document.querySelector(".preloader");
  if (!loader) return;

  const dismiss = () => loader.classList.add("is-done");

  if (PREFERS_REDUCED_MOTION) {
    dismiss();
    return;
  }

  // Wait for either full load or a hard cap so slow images never block entry
  window.addEventListener("load", () => setTimeout(dismiss, 500));
  setTimeout(dismiss, 2600);
}

/* --------------------------------------------------------------------------
   2. Scroll progress bar
   -------------------------------------------------------------------------- */
function initScrollProgress() {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;

  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : "0%";
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/* --------------------------------------------------------------------------
   3. Reveal on scroll — one observer for all reveal patterns
   -------------------------------------------------------------------------- */
function initRevealObserver() {
  const targets = document.querySelectorAll("[data-reveal], .stagger, .line-reveal");
  if (!targets.length) return;

  if (PREFERS_REDUCED_MOTION || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target); // reveal once, stay settled
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   4. Number counters — count up when the achievements band enters view
   -------------------------------------------------------------------------- */
function animateCounter(el) {
  const target   = parseFloat(el.dataset.count || "0");
  const decimals = (el.dataset.count || "").includes(".") ? 1 : 0;
  const duration = 1800;
  const start    = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = (target * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  if (PREFERS_REDUCED_MOTION || !("IntersectionObserver" in window)) {
    counters.forEach((el) => (el.textContent = el.dataset.count));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   5. Image tilt — subtle 3D hover on [data-tilt] frames
   -------------------------------------------------------------------------- */
function initTilt() {
  if (PREFERS_REDUCED_MOTION || window.matchMedia("(hover: none)").matches) return;

  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const strength = 7; // degrees at the frame edge

    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform =
        `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg)`;
    });

    el.addEventListener("pointerleave", () => {
      el.style.transform = "perspective(900px) rotateY(0) rotateX(0)";
    });
  });
}

/* --------------------------------------------------------------------------
   7. Hero parallax — blobs and floating cards drift with the pointer
   -------------------------------------------------------------------------- */
function initHeroParallax() {
  const hero = document.querySelector(".hero");
  if (!hero || PREFERS_REDUCED_MOTION || window.matchMedia("(hover: none)").matches) return;

  const layers = [
    { el: hero.querySelector(".blob--1"), depth: 26 },
    { el: hero.querySelector(".blob--2"), depth: 18 },
    { el: hero.querySelector(".float-card--appt"), depth: 10 },
    { el: hero.querySelector(".float-card--rating"), depth: 14 },
  ].filter((layer) => layer.el);

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    layers.forEach(({ el, depth }) => {
      el.style.translate = `${-x * depth}px ${-y * depth}px`;
    });
  });
}

/* --------------------------------------------------------------------------
   8. Page transitions — a teal veil sweeps down before navigation
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  if (PREFERS_REDUCED_MOTION) return;

  const veil = document.createElement("div");
  veil.className = "page-veil";
  veil.setAttribute("aria-hidden", "true");
  document.body.appendChild(veil);

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href");
    const isInternalPage =
      href &&
      href.endsWith(".html") &&
      !href.startsWith("http") &&
      link.target !== "_blank";

    if (!isInternalPage) return;

    e.preventDefault();
    veil.classList.add("is-leaving");
    setTimeout(() => (window.location.href = href), 420);
  });

  // If the page is restored from bfcache, make sure the veil is reset
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) veil.classList.remove("is-leaving");
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  initScrollProgress();
  initRevealObserver();
  initCounters();
  initTilt();
  initHeroParallax();
  initPageTransitions();
});