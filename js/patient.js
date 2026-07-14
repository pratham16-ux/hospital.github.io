/* ==========================================================================
   Stackly Hospital — Dashboard Suite · patient.js
   Patient data, view rendering, Chart.js wiring and every action button
   (view / reschedule / cancel, download / preview / share, pay / receipt,
   settings). Appointments persist to localStorage so changes survive
   a refresh.
   ========================================================================== */
"use strict";

/* --------------------------------------------------------------------------
   0. Guard + session
   -------------------------------------------------------------------------- */
const session = requireRole("patient");

/* --------------------------------------------------------------------------
   1. Demo data (appointments are persisted; the rest is static seed data)
   -------------------------------------------------------------------------- */
const APPT_KEY = "stacklyPatientAppointments";

const seedAppointments = [
  { id: 1, doctor: "Dr. Arvind Kulkarni", dept: "Cardiology",  when: "18 Jul 2026 · 10:30 AM", status: "Confirmed" },
  { id: 2, doctor: "Dr. Meera Krishnan",  dept: "Neurology",   when: "24 Jul 2026 · 4:00 PM",  status: "Pending"   },
  { id: 3, doctor: "Dr. Kavya Reddy",     dept: "Pediatrics",  when: "02 Jul 2026 · 11:00 AM", status: "Completed" },
  { id: 4, doctor: "Dr. Rohan Shetty",    dept: "Orthopedics", when: "14 Jun 2026 · 9:15 AM",  status: "Completed" },
];

let appointments = loadAppointments();

function loadAppointments() {
  try {
    const stored = JSON.parse(localStorage.getItem(APPT_KEY));
    return Array.isArray(stored) && stored.length ? stored : [...seedAppointments];
  } catch { return [...seedAppointments]; }
}
function persistAppointments() {
  localStorage.setItem(APPT_KEY, JSON.stringify(appointments));
}

const records = [
  { id: "LAB-2291", name: "Complete Blood Count",        meta: "Pathology · 02 Jul 2026 · PDF · 240 KB" },
  { id: "RAD-1108", name: "Chest X-Ray (PA view)",       meta: "Radiology · 14 Jun 2026 · DICOM · 1.2 MB" },
  { id: "LAB-2114", name: "Lipid Profile + HbA1c",       meta: "Pathology · 03 May 2026 · PDF · 210 KB" },
  { id: "CAR-0871", name: "2D Echo Report",              meta: "Cardiology · 03 May 2026 · PDF · 480 KB" },
];

const prescriptions = [
  { name: "Telmisartan 40 mg",  meta: "1-0-1 after food · 30 days · Dr. Arvind Kulkarni · Active",  active: true  },
  { name: "Atorvastatin 10 mg", meta: "0-0-1 at night · 90 days · Dr. Arvind Kulkarni · Active",    active: true  },
  { name: "Pantoprazole 40 mg", meta: "1-0-0 before food · 14 days · Dr. Sanjay Menon · Completed", active: false },
];

const myDoctors = [
  { name: "Dr. Arvind Kulkarni", meta: "Senior Interventional Cardiologist · Mon–Sat · OPD 204" },
  { name: "Dr. Meera Krishnan",  meta: "Consultant Neurologist · Tue, Thu, Sat · OPD 118" },
  { name: "Dr. Kavya Reddy",     meta: "Senior Pediatrician · Mon–Fri · OPD 310" },
];

let payments = [
  { id: "INV-26-0412", desc: "Cardiology OPD + 2D Echo", amount: 3200, status: "Paid"    },
  { id: "INV-26-0388", desc: "Lipid profile + HbA1c",    amount: 1450, status: "Paid"    },
  { id: "INV-26-0455", desc: "Neurology consultation",   amount: 900,  status: "Pending" },
];

const claims = [
  { name: "Claim #CLM-8841 — 2D Echo package", meta: "₹3,200 · Approved · Settled on 06 Jul 2026", ok: true },
  { name: "Claim #CLM-8710 — Annual health check", meta: "₹3,999 · Under review · Filed 28 Jun 2026", ok: false },
];

let notifications = [
  { title: "Appointment confirmed", meta: "Dr. Arvind Kulkarni · 18 Jul, 10:30 AM · OPD 204", unread: true  },
  { title: "Lab report ready",      meta: "Complete Blood Count — available in Medical Records", unread: true  },
  { title: "Payment reminder",      meta: "Invoice INV-26-0455 (₹900) is pending",               unread: true  },
  { title: "Flu vaccination drive", meta: "Sunday camp · 10 AM – 1 PM · Ground floor atrium",    unread: false },
];

/* --------------------------------------------------------------------------
   2. Icons (tiny inline SVG factory keeps markup out of the data)
   -------------------------------------------------------------------------- */
const ICONS = {
  file:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/></svg>',
  pill:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5-7-7a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 1 1-7 7Z"/><path d="m7 14 7-7"/></svg>',
  doc:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v5a5 5 0 0 0 10 0V3"/><path d="M10 21a5 5 0 0 0 5-5v-3"/><circle cx="19" cy="10" r="2.4"/></svg>',
  bell:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 11.5 2 2 4-4.5"/></svg>',
};

const statusPill = (status) => {
  const map = { Confirmed: "ok", Completed: "muted", Pending: "warn", Cancelled: "danger", Paid: "ok" };
  return `<span class="pill pill--${map[status] || "info"}">${status}</span>`;
};

/* --------------------------------------------------------------------------
   3. Dashboard stats + charts
   -------------------------------------------------------------------------- */
function renderStats() {
  const upcoming = appointments.filter((a) => a.status === "Confirmed" || a.status === "Pending");
  const pendingDue = payments.filter((p) => p.status === "Pending").reduce((sum, p) => sum + p.amount, 0);

  $("#patientStats").innerHTML = `
    <div class="stat c-teal"><span class="stat__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
      <b><span data-count="${upcoming.length}">0</span></b><small>Upcoming appointments</small></div>
    <div class="stat c-cyan"><span class="stat__ico">${ICONS.doc}</span>
      <b>18 Jul</b><small>Next doctor visit · Dr. Kulkarni</small></div>
    <div class="stat c-amber"><span class="stat__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg></span>
      <b>${fmtINR(pendingDue)}</b><small>Pending bills</small></div>
    <div class="stat c-indigo"><span class="stat__ico">${ICONS.file}</span>
      <b><span data-count="${records.length}">0</span></b><small>Medical reports on file</small></div>
    <div class="stat c-green"><span class="stat__ico">${ICONS.shield}</span>
      <b>Active</b><small>Insurance · cashless enabled</small></div>`;

  initCounters($("#patientStats"));
}

let charts = [];

function buildCharts() {
  if (typeof Chart === "undefined") return;   // CDN blocked — degrade quietly
  charts.forEach((c) => c.destroy());
  charts = [];

  const grid  = cssVar("--border");
  const label = cssVar("--muted");
  Chart.defaults.font.family = "Inter, sans-serif";
  Chart.defaults.color = label;

  charts.push(new Chart($("#chartAppointments"), {
    type: "bar",
    data: {
      labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [{
        label: "Visits",
        data: [1, 0, 2, 2, 1, 2],
        backgroundColor: cssVar("--secondary"),
        borderRadius: 8,
        maxBarThickness: 34,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: grid } },
        x: { grid: { display: false } },
      },
    },
  }));

  charts.push(new Chart($("#chartPayments"), {
    type: "doughnut",
    data: {
      labels: ["Consultations", "Diagnostics", "Pharmacy", "Pending"],
      datasets: [{
        data: [4100, 2650, 1300, 900],
        backgroundColor: [cssVar("--primary"), cssVar("--accent"), cssVar("--warning"), cssVar("--danger")],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "62%",
      plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } } },
    },
  }));

  charts.push(new Chart($("#chartHealth"), {
    type: "line",
    data: {
      labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        { label: "BP systolic",   data: [138, 134, 132, 128, 126, 124], borderColor: cssVar("--primary"), backgroundColor: "transparent", tension: .4 },
        { label: "Resting pulse", data: [82, 80, 79, 76, 74, 72],       borderColor: cssVar("--accent"),  backgroundColor: "transparent", tension: .4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } } },
      scales: { y: { grid: { color: grid } }, x: { grid: { display: false } } },
    },
  }));
}

/* --------------------------------------------------------------------------
   4. Appointments — table + view / reschedule / cancel / book
   -------------------------------------------------------------------------- */
function renderAppointments() {
  const rows = $("#apptRows");
  rows.innerHTML = appointments.map((a) => `
    <tr data-id="${a.id}">
      <td><div class="who"><span class="avatar" aria-hidden="true">${initials(a.doctor)}</span><span><b>${escapeHtml(a.doctor)}</b><small>OPD consult</small></span></div></td>
      <td>${escapeHtml(a.dept)}</td>
      <td>${escapeHtml(a.when)}</td>
      <td>${statusPill(a.status)}</td>
      <td><div class="row-actions">
        <button class="btn btn--soft btn--sm" data-act="view">View</button>
        <button class="btn btn--ghost btn--sm" data-act="reschedule" ${a.status === "Completed" || a.status === "Cancelled" ? "disabled" : ""}>Reschedule</button>
        <button class="btn btn--danger btn--sm" data-act="cancel" ${a.status !== "Confirmed" && a.status !== "Pending" ? "disabled" : ""}>Cancel</button>
      </div></td>
    </tr>`).join("");

  $("#apptEmpty").hidden = appointments.length > 0;
}

function initials(name) {
  return name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("");
}

function handleAppointmentActions() {
  $("#apptRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = Number(btn.closest("tr").dataset.id);
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;

    if (btn.dataset.act === "view") {
      openModal({
        title: appt.doctor,
        sub: `${appt.dept} · ${appt.when}`,
        body: `
          <div class="pref-row"><span><b>Status</b></span>${statusPill(appt.status)}</div>
          <div class="pref-row"><span><b>Location</b></span><span>OPD Tower A, Level 2</span></div>
          <div class="pref-row"><span><b>Token</b></span><span style="font-family:var(--font-mono);">A-${String(id).padStart(2, "0")}${id * 7}</span></div>
          <div class="pref-row"><span><b>Carry</b></span><span>Previous reports, insurance card</span></div>`,
        actions: [{ label: "Close", cls: "btn--primary", onClick: closeModal }],
      });
    }

    if (btn.dataset.act === "reschedule") {
      openModal({
        title: "Reschedule appointment",
        sub: `${appt.doctor} · currently ${appt.when}`,
        body: `
          <div class="field"><label for="rsDate">New date</label><input type="date" id="rsDate"><span class="field-error" role="alert"></span></div>
          <div class="field"><label for="rsSlot">Preferred slot</label>
            <select id="rsSlot"><option>9:00 AM</option><option>10:30 AM</option><option>12:00 PM</option><option>4:00 PM</option><option>6:30 PM</option></select>
          </div>`,
        actions: [
          { label: "Keep existing", cls: "btn--ghost", onClick: closeModal },
          {
            label: "Confirm new slot", cls: "btn--primary",
            onClick: () => {
              const dateInput = $("#rsDate");
              if (!dateInput.value) {
                dateInput.closest(".field").classList.add("has-error");
                dateInput.closest(".field").querySelector(".field-error").textContent = "Pick a date first.";
                return;
              }
              const pretty = new Date(dateInput.value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              appt.when = `${pretty} · ${$("#rsSlot").value}`;
              appt.status = "Pending";
              persistAppointments();
              renderAppointments();
              renderStats();
              closeModal();
              showToast("Reschedule requested — the front desk will confirm shortly.");
            },
          },
        ],
      });
    }

    if (btn.dataset.act === "cancel") {
      openModal({
        title: "Cancel this appointment?",
        sub: `${appt.doctor} · ${appt.when}`,
        body: `<p style="font-size:14px;">Cancelling is free up to 2 hours before your slot. The token will be released to other patients.</p>`,
        actions: [
          { label: "Keep it", cls: "btn--ghost", onClick: closeModal },
          {
            label: "Yes, cancel", cls: "btn--danger",
            onClick: () => {
              appt.status = "Cancelled";
              persistAppointments();
              renderAppointments();
              renderStats();
              closeModal();
              showToast("Appointment cancelled.");
            },
          },
        ],
      });
    }
  });

  $("#newApptBtn").addEventListener("click", () => {
    openModal({
      title: "Book appointment",
      sub: "Front desk confirms on call within 30 minutes.",
      body: `
        <div class="field"><label for="naDept">Department</label>
          <select id="naDept"><option>Cardiology</option><option>Neurology</option><option>Orthopedics</option><option>Pediatrics</option><option>General Medicine</option><option>Gynecology</option></select>
        </div>
        <div class="field"><label for="naDate">Preferred date</label><input type="date" id="naDate"><span class="field-error" role="alert"></span></div>
        <div class="field"><label for="naSlot">Preferred slot</label>
          <select id="naSlot"><option>9:00 AM</option><option>10:30 AM</option><option>12:00 PM</option><option>4:00 PM</option><option>6:30 PM</option></select>
        </div>`,
      actions: [
        { label: "Cancel", cls: "btn--ghost", onClick: closeModal },
        {
          label: "Request booking", cls: "btn--primary",
          onClick: () => {
            const dateInput = $("#naDate");
            if (!dateInput.value) {
              dateInput.closest(".field").classList.add("has-error");
              dateInput.closest(".field").querySelector(".field-error").textContent = "Pick a date first.";
              return;
            }
            const deptDoctor = {
              Cardiology: "Dr. Arvind Kulkarni", Neurology: "Dr. Meera Krishnan",
              Orthopedics: "Dr. Rohan Shetty",   Pediatrics: "Dr. Kavya Reddy",
              "General Medicine": "Dr. Sanjay Menon", Gynecology: "Dr. Priya Deshmukh",
            };
            const dept = $("#naDept").value;
            const pretty = new Date(dateInput.value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
            appointments.unshift({
              id: Date.now(),
              doctor: deptDoctor[dept],
              dept,
              when: `${pretty} · ${$("#naSlot").value}`,
              status: "Pending",
            });
            persistAppointments();
            renderAppointments();
            renderStats();
            closeModal();
            showToast("Booking requested! We'll call to confirm.");
          },
        },
      ],
    });
  });
}

/* --------------------------------------------------------------------------
   5. Records / prescriptions / doctors / claims / notifications lists
   -------------------------------------------------------------------------- */
function listItem({ icon, name, meta, actionsHtml = "", unread = false }) {
  return `
    <div class="list-item ${unread ? "is-unread" : ""}">
      <span class="ico" aria-hidden="true">${icon}</span>
      <div class="body"><b>${escapeHtml(name)}</b><small>${escapeHtml(meta)}</small></div>
      ${actionsHtml}
    </div>`;
}

function renderRecords() {
  $("#recordList").innerHTML = records.map((r) =>
    listItem({
      icon: ICONS.file,
      name: r.name,
      meta: r.meta,
      actionsHtml: `<div class="row-actions">
        <button class="btn btn--soft btn--sm" data-rec="preview" data-id="${r.id}">Preview</button>
        <button class="btn btn--ghost btn--sm" data-rec="download" data-id="${r.id}">Download</button>
        <button class="btn btn--ghost btn--sm" data-rec="share" data-id="${r.id}">Share</button>
      </div>`,
    })).join("");

  $("#recordList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-rec]");
    if (!btn) return;
    const rec = records.find((r) => r.id === btn.dataset.id);
    if (!rec) return;

    if (btn.dataset.rec === "preview") {
      openModal({
        title: rec.name,
        sub: rec.meta,
        body: `
          <div class="pref-row"><span><b>Patient</b></span><span>Ramesh Kumar · STK-2024-08841</span></div>
          <div class="pref-row"><span><b>Referred by</b></span><span>Dr. Arvind Kulkarni</span></div>
          <div class="pref-row"><span><b>Impression</b></span><span>Within normal limits</span></div>
          <p style="font-size:13px;color:var(--muted);margin-top:6px;">Full report opens in the hospital records viewer. This is a summary preview.</p>`,
        actions: [{ label: "Close", cls: "btn--primary", onClick: closeModal }],
      });
    }
    if (btn.dataset.rec === "download") {
      downloadFile(`${rec.id}-${rec.name.replace(/\s+/g, "-")}.txt`,
        `Stackly Hospital & Clinic\nReport: ${rec.name}\nRef: ${rec.id}\n${rec.meta}\nPatient: Ramesh Kumar (STK-2024-08841)\n\nImpression: Within normal limits.\n`);
      showToast("Report downloaded.");
    }
    if (btn.dataset.rec === "share") {
      openModal({
        title: "Share report",
        sub: rec.name,
        body: `<div class="field"><label for="shEmail">Send to email</label><input type="email" id="shEmail" placeholder="doctor@clinic.com"><span class="field-error" role="alert"></span></div>`,
        actions: [
          { label: "Cancel", cls: "btn--ghost", onClick: closeModal },
          {
            label: "Send securely", cls: "btn--primary",
            onClick: () => {
              const input = $("#shEmail");
              if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input.value.trim())) {
                input.closest(".field").classList.add("has-error");
                input.closest(".field").querySelector(".field-error").textContent = "Enter a valid email.";
                return;
              }
              closeModal();
              showToast(`Report shared with ${input.value.trim()}.`);
            },
          },
        ],
      });
    }
  });
}

function renderPrescriptions() {
  $("#rxList").innerHTML = prescriptions.map((rx) =>
    listItem({
      icon: ICONS.pill,
      name: rx.name,
      meta: rx.meta,
      actionsHtml: `<span class="pill ${rx.active ? "pill--ok" : "pill--muted"}">${rx.active ? "Active" : "Done"}</span>`,
    })).join("");
}

function renderDoctors() {
  $("#doctorList").innerHTML = myDoctors.map((d) =>
    listItem({
      icon: ICONS.doc,
      name: d.name,
      meta: d.meta,
      actionsHtml: `<button class="btn btn--soft btn--sm" data-book>Book again</button>`,
    })).join("");

  $("#doctorList").addEventListener("click", (e) => {
    if (e.target.closest("[data-book]")) {
      window.location.hash = "appointments";
      setTimeout(() => $("#newApptBtn").click(), 250);
    }
  });
}

function renderClaims() {
  $("#claimList").innerHTML = claims.map((c) =>
    listItem({
      icon: ICONS.shield,
      name: c.name,
      meta: c.meta,
      actionsHtml: `<span class="pill ${c.ok ? "pill--ok" : "pill--warn"}">${c.ok ? "Settled" : "In review"}</span>`,
    })).join("");
}

function renderNotifications() {
  $("#notifList").innerHTML = notifications.map((n) =>
    listItem({ icon: ICONS.bell, name: n.title, meta: n.meta, unread: n.unread })).join("");
  $("#notifCount").textContent = notifications.filter((n) => n.unread).length || "";
  $("#notifCount").style.display = notifications.some((n) => n.unread) ? "grid" : "none";
}

/* --------------------------------------------------------------------------
   6. Payments — invoice / receipt / pay now
   -------------------------------------------------------------------------- */
function renderPayments() {
  $("#paymentRows").innerHTML = payments.map((p) => `
    <tr data-id="${p.id}">
      <td style="font-family:var(--font-mono);font-size:13px;">${p.id}</td>
      <td>${escapeHtml(p.desc)}</td>
      <td><b>${fmtINR(p.amount)}</b></td>
      <td>${statusPill(p.status)}</td>
      <td><div class="row-actions">
        <button class="btn btn--ghost btn--sm" data-pay="invoice">Invoice</button>
        ${p.status === "Paid"
          ? '<button class="btn btn--soft btn--sm" data-pay="receipt">Receipt</button>'
          : '<button class="btn btn--primary btn--sm" data-pay="paynow">Pay Now</button>'}
      </div></td>
    </tr>`).join("");
}

function handlePaymentActions() {
  $("#paymentRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-pay]");
    if (!btn) return;
    const inv = payments.find((p) => p.id === btn.closest("tr").dataset.id);
    if (!inv) return;

    if (btn.dataset.pay === "invoice" || btn.dataset.pay === "receipt") {
      const kind = btn.dataset.pay === "invoice" ? "Invoice" : "Receipt";
      downloadFile(`${inv.id}-${kind}.txt`,
        `Stackly Hospital & Clinic — ${kind}\n${"=".repeat(40)}\nNo: ${inv.id}\nFor: ${inv.desc}\nAmount: ${fmtINR(inv.amount)} (incl. GST)\nStatus: ${inv.status}\nPatient: Ramesh Kumar (STK-2024-08841)\nMode: UPI / Card / Cashless\n`);
      showToast(`${kind} downloaded.`);
    }

    if (btn.dataset.pay === "paynow") {
      openModal({
        title: "Pay " + fmtINR(inv.amount),
        sub: `${inv.id} · ${inv.desc}`,
        body: `
          <div class="field"><label for="payMode">Payment method</label>
            <select id="payMode"><option>UPI — ramesh@okhdfc</option><option>Card ending 4412</option><option>Net banking</option></select>
          </div>
          <p style="font-size:13px;color:var(--muted);">Payments are processed by the hospital's secure gateway. A receipt is issued instantly.</p>`,
        actions: [
          { label: "Cancel", cls: "btn--ghost", onClick: closeModal },
          {
            label: "Pay securely", cls: "btn--primary",
            onClick: () => {
              inv.status = "Paid";
              renderPayments();
              renderStats();
              closeModal();
              showToast(`Payment of ${fmtINR(inv.amount)} successful. Receipt ready.`);
            },
          },
        ],
      });
    }
  });
}

/* --------------------------------------------------------------------------
   7. Profile, support, settings
   -------------------------------------------------------------------------- */
function withLoading(btn, done) {
  btn.classList.add("is-loading");
  setTimeout(() => { btn.classList.remove("is-loading"); done(); }, 700);
}

function initProfileAndSettings() {
  $("#saveProfileBtn").addEventListener("click", (e) => {
    const phone = $("#pfPhone").value.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      showToast("Enter a valid 10-digit mobile starting 6–9.", true);
      return;
    }
    withLoading(e.currentTarget, () => showToast("Profile saved."));
  });

  $("#ticketBtn").addEventListener("click", (e) => {
    const msg = $("#spMsg");
    const field = msg.closest(".field");
    if (!msg.value.trim()) {
      field.classList.add("has-error");
      field.querySelector(".field-error").textContent = "Tell us a little about the issue.";
      return;
    }
    field.classList.remove("has-error");
    withLoading(e.currentTarget, () => {
      msg.value = "";
      showToast("Ticket raised — reference sent to your email.");
    });
  });

  $("#passwordBtn").addEventListener("click", (e) => {
    const current = $("#stCurrent"), fresh = $("#stNew"), confirm = $("#stConfirm");
    const fail = (input, text) => {
      const field = input.closest(".field");
      field.classList.add("has-error");
      field.querySelector(".field-error").textContent = text;
    };
    [current, fresh, confirm].forEach((i) => i.closest(".field").classList.remove("has-error"));

    if (!current.value)            return fail(current, "Enter your current password.");
    if (fresh.value.length < 8)    return fail(fresh, "Minimum 8 characters.");
    if (!/[A-Za-z]/.test(fresh.value) || !/\d/.test(fresh.value))
                                   return fail(fresh, "Use letters and at least one number.");
    if (confirm.value !== fresh.value) return fail(confirm, "Passwords do not match.");

    withLoading(e.currentTarget, () => {
      current.value = fresh.value = confirm.value = "";
      showToast("Password updated.");
    });
  });

  // Theme switch mirrors the topbar toggle
  const themeSwitch = $("#themeSwitch");
  themeSwitch.checked = document.documentElement.getAttribute("data-theme") === "dark";
  themeSwitch.addEventListener("change", toggleTheme);
  document.addEventListener("themechange", () => {
    themeSwitch.checked = document.documentElement.getAttribute("data-theme") === "dark";
    buildCharts();
  });

  $("#savePrefsBtn").addEventListener("click", () => showToast("Preferences saved."));

  $("#markReadBtn").addEventListener("click", () => {
    notifications = notifications.map((n) => ({ ...n, unread: false }));
    renderNotifications();
    showToast("All notifications marked as read.");
  });
}

/* --------------------------------------------------------------------------
   8. Global search — jumps to the most relevant view
   -------------------------------------------------------------------------- */
function initGlobalSearch() {
  $("#globalSearch").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const target =
      q.includes("pay") || q.includes("invoice") || q.includes("bill") ? "payments" :
      q.includes("report") || q.includes("record") ? "records" :
      q.includes("doc") ? "doctors" :
      q.includes("insur") || q.includes("claim") ? "insurance" :
      "appointments";
    window.location.hash = target;
    showToast(`Showing results in ${target}.`);
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!session) return;

  // Identity in the topbar
  $("#profileEmail").textContent = session.email;
  $("#avatarInitials").textContent = session.email[0].toUpperCase();
  const loginDate = new Date(session.loginTime);
  $("#dashGreeting").textContent =
    `Signed in ${loginDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Here's your health at a glance.`;

  renderStats();
  renderAppointments();
  renderRecords();
  renderPrescriptions();
  renderDoctors();
  renderPayments();
  renderClaims();
  renderNotifications();

  handleAppointmentActions();
  handlePaymentActions();
  initProfileAndSettings();
  initGlobalSearch();
  initRouter("dashboard");

  // Charts wait for the Chart.js CDN if it hasn't parsed yet
  if (typeof Chart !== "undefined") buildCharts();
  else window.addEventListener("load", buildCharts);
});