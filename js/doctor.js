/* ==========================================================================
   Stackly Hospital — Dashboard Suite · doctor.js
   Clinical console: patient queue, appointment management (CRUD + persist),
   schedule, records, prescription builder with print, period reports,
   billing, messages, notifications, Chart.js analytics and settings.
   Requires common.js. Author: Stackly Frontend Team (SNAB Solutions)
   ========================================================================== */
"use strict";

/* --------------------------------------------------------------------------
   0. Guard — only doctors past this point
   -------------------------------------------------------------------------- */
const session = requireRole("doctor");

/* --------------------------------------------------------------------------
   1. Demo data (appointments + prescriptions persist across reloads)
   -------------------------------------------------------------------------- */
const D_APPT_KEY  = "stacklyDoctorAppointments";
const D_RX_KEY    = "stacklyDoctorPrescriptions";
const D_SET_KEY   = "stacklyDoctorSettings";

let patients = [
  { id: 1, name: "Suresh Patil",   age: 62, dept: "Cardiology",  time: "09:15 AM", status: "Completed" },
  { id: 2, name: "Ananya Nair",    age: 31, dept: "Gynecology",  time: "09:45 AM", status: "Completed" },
  { id: 3, name: "K. Raghavan",    age: 68, dept: "Orthopedics", time: "10:20 AM", status: "In consult" },
  { id: 4, name: "Farida Begum",   age: 54, dept: "Oncology",    time: "11:00 AM", status: "Waiting" },
  { id: 5, name: "Vikram Gowda",   age: 8,  dept: "Pediatrics",  time: "11:30 AM", status: "Waiting" },
  { id: 6, name: "Deepa Hegde",    age: 45, dept: "Cardiology",  time: "12:10 PM", status: "Waiting" },
  { id: 7, name: "Mohammed Irfan", age: 27, dept: "General Medicine", time: "12:40 PM", status: "Waiting" },
];

const seedAppointments = [
  { id: 1, patient: "Deepa Hegde",    dept: "Cardiology",  when: "14 Jul · 12:10 PM", status: "Confirmed" },
  { id: 2, patient: "Rohit Sharma",   dept: "Cardiology",  when: "14 Jul · 04:30 PM", status: "Pending"   },
  { id: 3, patient: "Lakshmi Devi",   dept: "General Medicine", when: "15 Jul · 09:30 AM", status: "Confirmed" },
  { id: 4, patient: "Arjun Kamath",   dept: "Orthopedics", when: "15 Jul · 11:00 AM", status: "Confirmed" },
  { id: 5, patient: "Sneha Kulkarni", dept: "Pediatrics",  when: "16 Jul · 10:15 AM", status: "Cancelled" },
];

let appointments = loadAppointments();

function loadAppointments() {
  try { return JSON.parse(localStorage.getItem(D_APPT_KEY)) || seedAppointments.slice(); }
  catch { return seedAppointments.slice(); }
}
function persistAppointments() {
  localStorage.setItem(D_APPT_KEY, JSON.stringify(appointments));
}

const schedule = [
  { name: "OPD — Cardiology, Room 204",      meta: "Mon–Sat · 9:00 AM – 1:00 PM" },
  { name: "Cath lab procedures",             meta: "Tue & Thu · 2:30 PM – 5:30 PM" },
  { name: "ICU rounds — Tower B, Level 3",   meta: "Daily · 8:15 AM & 7:00 PM" },
  { name: "Tumour board review",             meta: "Wed · 4:00 PM · Conference Hall 2" },
  { name: "Teleconsults",                    meta: "Mon, Wed, Fri · 6:00 PM – 7:00 PM" },
  { name: "DNB teaching session",            meta: "Sat · 2:00 PM · Academic Block" },
];

let records = [
  { id: 1, name: "Suresh Patil — Angiography report",   meta: "PDF · 1.8 MB · 12 Jul 2026" },
  { id: 2, name: "K. Raghavan — Knee X-ray (post-op)",  meta: "DICOM · 4.2 MB · 11 Jul 2026" },
  { id: 3, name: "Farida Begum — Chemo cycle 4 notes",  meta: "PDF · 640 KB · 10 Jul 2026" },
  { id: 4, name: "Deepa Hegde — Lipid profile",         meta: "PDF · 210 KB · 09 Jul 2026" },
];

const departments = [
  { name: "Cardiology",  head: "Dr. Arvind Kulkarni", opd: 34, beds: "18 / 24", status: "Busy" },
  { name: "Neurology",   head: "Dr. Meera Krishnan",  opd: 22, beds: "11 / 16", status: "Normal" },
  { name: "Orthopedics", head: "Dr. Rohan Shetty",    opd: 27, beds: "14 / 20", status: "Normal" },
  { name: "Pediatrics",  head: "Dr. Kavya Reddy",     opd: 31, beds: "12 / 18", status: "Busy" },
  { name: "Oncology",    head: "Dr. Farhan Ahmed",    opd: 15, beds: "20 / 22", status: "Full"  },
  { name: "Emergency",   head: "Dr. Nithin Rao",      opd: 12, beds: "05 / 07", status: "Normal" },
];

const billing = [
  { id: "INV-2216", patient: "Suresh Patil",  service: "Angiography + consult", amount: 18500, status: "Paid"    },
  { id: "INV-2217", patient: "Ananya Nair",   service: "Antenatal package",     amount: 4200,  status: "Paid"    },
  { id: "INV-2218", patient: "K. Raghavan",   service: "Post-op physio (4x)",   amount: 3600,  status: "Pending" },
  { id: "INV-2219", patient: "Farida Begum",  service: "Chemo day-care cycle",  amount: 22400, status: "Pending" },
  { id: "INV-2220", patient: "Vikram Gowda",  service: "Nebulisation + consult", amount: 1150, status: "Paid"    },
];

let messages = [
  { id: 1, from: "Rekha Pillai · Nursing",   subject: "Bed 14 shifted to step-down", body: "Post-angioplasty vitals stable through the night; shifted from ICU to step-down at 6 AM.", time: "8:42 AM", unread: true },
  { id: 2, from: "Lab · Biochemistry",       subject: "Critical value — Troponin",   body: "Patient Rohit Sharma: Troponin-I 2.4 ng/mL. Duty physician informed as per protocol.",      time: "8:10 AM", unread: true },
  { id: 3, from: "Front desk",               subject: "4:30 PM slot double-booked",  body: "Two walk-ins requested the same evening slot; kept Mr. Sharma, moved the other to 5 PM.",   time: "Yesterday", unread: false },
  { id: 4, from: "Dr. Meera Krishnan",       subject: "Cross-consult — Bed 21",      body: "Would value your cardiac opinion on the stroke patient in Bed 21 before thrombolysis review.", time: "Yesterday", unread: false },
];

let notifications = [
  { id: 1, name: "Emergency admitted — chest pain, 52 M", meta: "Triage 2 · 7:58 AM · Cath lab on standby", unread: true },
  { id: 2, name: "Tumour board moved to 4:30 PM",          meta: "Conference Hall 2 · today",                unread: true },
  { id: 3, name: "3 discharge summaries pending sign-off", meta: "Due before 6 PM",                          unread: true },
  { id: 4, name: "CME credits updated — 4 hrs added",      meta: "Karnataka Medical Council portal",         unread: true },
];

/* Report datasets per period */
const reportData = {
  daily:   [["Patients seen", "23", "+3"], ["Procedures", "4", "+1"], ["Revenue", "₹64,300", "+9%"], ["Avg. consult time", "14 min", "−2 min"], ["No-shows", "2", "−1"]],
  weekly:  [["Patients seen", "142", "+11"], ["Procedures", "26", "+4"], ["Revenue", "₹4,18,600", "+7%"], ["Avg. consult time", "15 min", "±0"], ["No-shows", "9", "−3"]],
  monthly: [["Patients seen", "584", "+38"], ["Procedures", "104", "+12"], ["Revenue", "₹16,72,400", "+12%"], ["Avg. consult time", "15 min", "−1 min"], ["No-shows", "31", "−6"]],
};

/* --------------------------------------------------------------------------
   2. Shared bits
   -------------------------------------------------------------------------- */
const ICONS = {
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></svg>',
  pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5-7-7a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 1 1-7 7Z"/><path d="m7 14 7-7"/></svg>',
};

const statusPill = (status) => {
  const map = {
    Confirmed: "ok", Completed: "muted", Pending: "warn", Cancelled: "danger",
    Paid: "ok", Waiting: "warn", "In consult": "info", Busy: "warn", Normal: "ok", Full: "danger",
  };
  return `<span class="pill pill--${map[status] || "info"}">${status}</span>`;
};

const initials = (name) => name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("");

function listItem({ icon, name, meta, actionsHtml = "", unread = false }) {
  return `
    <div class="list-item ${unread ? "is-unread" : ""}">
      <span class="ico" aria-hidden="true">${icon}</span>
      <div class="body"><b>${escapeHtml(name)}</b><small>${escapeHtml(meta)}</small></div>
      ${actionsHtml}
    </div>`;
}

function withLoading(btn, done) {
  btn.classList.add("is-loading");
  setTimeout(() => { btn.classList.remove("is-loading"); done(); }, 700);
}

/** Print a single panel: clone → print-only container → window.print(). */
function printSection(el, title) {
  const clone = document.createElement("div");
  clone.id = "printClone";
  clone.innerHTML = `<h2 style="font-family:Manrope,sans-serif;">${escapeHtml(title)}</h2>` + el.innerHTML;
  document.body.appendChild(clone);
  document.body.classList.add("print-mode");
  const cleanup = () => {
    document.body.classList.remove("print-mode");
    clone.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

/* --------------------------------------------------------------------------
   3. Dashboard — stats, inflow chart, queue preview
   -------------------------------------------------------------------------- */
function renderStats() {
  const waiting  = patients.filter((p) => p.status !== "Completed").length;
  const revenue  = billing.filter((b) => b.status === "Paid").reduce((s, b) => s + b.amount, 0);
  const pendingR = records.length ? 3 : 0;

  $("#doctorStats").innerHTML = `
    <div class="stat c-teal"><span class="stat__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.4"/><path d="M2.5 21c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15.4 15.9a5.7 5.7 0 0 1 6.1 4.6"/></svg></span>
      <b><span data-count="${patients.length}">0</span></b><small>Today's patients · ${waiting} in queue</small></div>
    <div class="stat c-cyan"><span class="stat__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
      <b><span data-count="${appointments.filter((a) => a.status !== "Cancelled").length}">0</span></b><small>Active appointments</small></div>
    <div class="stat c-green"><span class="stat__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg></span>
      <b>${fmtINR(revenue)}</b><small>Revenue collected today</small></div>
    <div class="stat c-amber"><span class="stat__ico">${ICONS.file}</span>
      <b><span data-count="${pendingR}">0</span></b><small>Reports pending sign-off</small></div>
    <div class="stat c-red"><span class="stat__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg></span>
      <b><span data-count="1">0</span></b><small>Emergency case · Triage 2</small></div>
    <div class="stat c-indigo"><span class="stat__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/></svg></span>
      <b><span data-count="${departments.length}">0</span></b><small>Departments reporting in</small></div>`;

  initCounters($("#doctorStats"));
}

function renderQueuePreview() {
  const queue = patients.filter((p) => p.status !== "Completed").slice(0, 4);
  $("#queuePreview").innerHTML = queue.map((p) =>
    listItem({
      icon: `<b style="font-family:Manrope">${initials(p.name)}</b>`,
      name: `${p.name} · ${p.dept}`,
      meta: `${p.time} · ${p.status}`,
    })
  ).join("");
}

/* --------------------------------------------------------------------------
   4. Charts — built lazily per view, rebuilt on theme change
   -------------------------------------------------------------------------- */
const charts = {};
const builtViews = new Set();

function chartDefaults() {
  Chart.defaults.font.family = "Inter, sans-serif";
  Chart.defaults.color = cssVar("--muted");
  Chart.defaults.borderColor = cssVar("--line");
}

function buildDashboardChart() {
  chartDefaults();
  charts.inflow?.destroy();
  charts.inflow = new Chart($("#chartInflow"), {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: "Patients",
        data: [21, 26, 24, 29, 23, 18, 9],
        borderColor: cssVar("--primary"),
        backgroundColor: "rgba(20, 184, 166, .14)",
        fill: true, tension: .4, borderWidth: 2.5,
        pointBackgroundColor: cssVar("--primary"), pointRadius: 3.5,
      }],
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

function buildAnalyticsCharts() {
  chartDefaults();
  const teal = cssVar("--primary"), cyan = cssVar("--accent"),
        amber = "#F59E0B", indigo = "#6366F1", red = "#EF4444";

  charts.pie?.destroy();
  charts.pie = new Chart($("#chartPie"), {
    type: "pie",
    data: {
      labels: ["Cardiology", "General", "Ortho", "Pediatrics", "Oncology"],
      datasets: [{ data: [34, 22, 18, 16, 10], backgroundColor: [teal, cyan, amber, indigo, red], borderWidth: 0 }],
    },
    options: { maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
  });

  charts.bar?.destroy();
  charts.bar = new Chart($("#chartBar"), {
    type: "bar",
    data: {
      labels: ["W1", "W2", "W3", "W4"],
      datasets: [
        { label: "OPD",        data: [96, 108, 122, 142], backgroundColor: teal,  borderRadius: 6 },
        { label: "Procedures", data: [18, 22, 19, 26],    backgroundColor: amber, borderRadius: 6 },
      ],
    },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
  });

  charts.line?.destroy();
  charts.line = new Chart($("#chartLine"), {
    type: "line",
    data: {
      labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [{
        label: "Revenue (₹ L)",
        data: [11.2, 12.6, 12.1, 14.4, 15.2, 16.7],
        borderColor: indigo, backgroundColor: "rgba(99, 102, 241, .12)",
        fill: true, tension: .4, borderWidth: 2.5, pointRadius: 3.5, pointBackgroundColor: indigo,
      }],
    },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });
}

function initCharts() {
  const buildFor = (view) => {
    if (typeof Chart === "undefined") return;
    if (view === "dashboard" && !builtViews.has("dashboard")) { buildDashboardChart(); builtViews.add("dashboard"); }
    if (view === "analytics" && !builtViews.has("analytics")) { buildAnalyticsCharts(); builtViews.add("analytics"); }
  };

  document.addEventListener("viewchange", (e) => buildFor(e.detail.view));
  document.addEventListener("themechange", () => {
    // Rebuild everything already on screen with the new palette
    if (builtViews.has("dashboard")) buildDashboardChart();
    if (builtViews.has("analytics")) buildAnalyticsCharts();
  });

  const current = window.location.hash.slice(1) || "dashboard";
  if (typeof Chart !== "undefined") buildFor(current);
  else window.addEventListener("load", () => buildFor(window.location.hash.slice(1) || "dashboard"));
}

/* --------------------------------------------------------------------------
   5. Patients table — search, status filter, row actions
   -------------------------------------------------------------------------- */
function renderPatients() {
  const term   = $("#patientSearch").value.trim().toLowerCase();
  const status = $("#patientStatusFilter").value;

  const rows = patients.filter((p) =>
    (status === "all" || p.status === status) &&
    (!term || p.name.toLowerCase().includes(term))
  );

  $("#patientRows").innerHTML = rows.map((p) => `
    <tr data-id="${p.id}">
      <td><div class="who"><span class="avatar" aria-hidden="true">${initials(p.name)}</span><span><b>${escapeHtml(p.name)}</b><small>MRN-10${p.id}4</small></span></div></td>
      <td>${p.age}</td>
      <td>${escapeHtml(p.dept)}</td>
      <td>${escapeHtml(p.time)}</td>
      <td>${statusPill(p.status)}</td>
      <td><div class="row-actions">
        <button class="btn btn--soft btn--sm" data-act="view">View</button>
        <button class="btn btn--ghost btn--sm" data-act="edit">Edit</button>
        <button class="btn btn--ghost btn--sm" data-act="rx">Prescription</button>
        <button class="btn btn--primary btn--sm" data-act="complete" ${p.status === "Completed" ? "disabled" : ""}>Complete</button>
      </div></td>
    </tr>`).join("");

  $("#patientEmpty").hidden = rows.length > 0;
}

function handlePatientActions() {
  $("#patientSearch").addEventListener("input", renderPatients);
  $("#patientStatusFilter").addEventListener("change", renderPatients);

  $("#patientRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const p = patients.find((x) => x.id === Number(btn.closest("tr").dataset.id));
    if (!p) return;

    if (btn.dataset.act === "view") {
      openModal({
        title: p.name,
        sub: `MRN-10${p.id}4 · ${p.dept}`,
        body: `
          <div class="kv"><span>Age</span><b>${p.age} years</b></div>
          <div class="kv"><span>Slot</span><b>${p.time} today</b></div>
          <div class="kv"><span>Status</span><b>${p.status}</b></div>
          <div class="kv"><span>Allergies</span><b>None on record</b></div>
          <div class="kv"><span>Last visit</span><b>21 Jun 2026 · follow-up</b></div>`,
        actions: [{ label: "Close", cls: "btn--primary", onClick: closeModal }],
      });
    }

    if (btn.dataset.act === "edit") {
      openModal({
        title: "Edit patient",
        sub: "Corrections apply to today's OPD list only.",
        body: `
          <div class="field"><label for="edName">Name</label><input id="edName" type="text" value="${escapeHtml(p.name)}"></div>
          <div class="field"><label for="edAge">Age</label><input id="edAge" type="number" min="0" max="120" value="${p.age}"></div>
          <div class="field"><label for="edDept">Department</label>
            <select id="edDept">${departments.map((d) => `<option ${d.name === p.dept ? "selected" : ""}>${d.name}</option>`).join("")}</select>
          </div>`,
        actions: [
          { label: "Discard", onClick: closeModal },
          { label: "Save", cls: "btn--primary", onClick: () => {
              const name = $("#edName").value.trim();
              const age  = Number($("#edAge").value);
              if (!name || !age) { showToast("Name and a valid age are required.", true); return; }
              Object.assign(p, { name, age, dept: $("#edDept").value });
              renderPatients(); renderQueuePreview(); closeModal();
              showToast("Patient details updated.");
            } },
        ],
      });
    }

    if (btn.dataset.act === "rx") {
      $("#rxPatient").value = p.name;
      rxState.patient = p.name;
      renderRxPreviewMeta();
      window.location.hash = "prescriptions";
      showToast(`Prescription started for ${p.name}.`);
    }

    if (btn.dataset.act === "complete") {
      p.status = "Completed";
      renderPatients(); renderQueuePreview(); renderStats();
      showToast(`${p.name} marked as completed.`);
    }
  });
}

/* --------------------------------------------------------------------------
   6. Appointment management — add / edit / delete / search / filter
   -------------------------------------------------------------------------- */
function renderDoctorAppointments() {
  const term   = $("#apptSearch").value.trim().toLowerCase();
  const status = $("#apptFilter").value;

  const rows = appointments.filter((a) =>
    (status === "all" || a.status === status) &&
    (!term || a.patient.toLowerCase().includes(term) || a.dept.toLowerCase().includes(term))
  );

  $("#dApptRows").innerHTML = rows.map((a) => `
    <tr data-id="${a.id}">
      <td><div class="who"><span class="avatar" aria-hidden="true">${initials(a.patient)}</span><span><b>${escapeHtml(a.patient)}</b><small>OPD booking</small></span></div></td>
      <td>${escapeHtml(a.dept)}</td>
      <td>${escapeHtml(a.when)}</td>
      <td>${statusPill(a.status)}</td>
      <td><div class="row-actions">
        <button class="btn btn--ghost btn--sm" data-act="edit">Edit</button>
        <button class="btn btn--danger btn--sm" data-act="delete">Delete</button>
      </div></td>
    </tr>`).join("");

  $("#dApptEmpty").hidden = rows.length > 0;
}

function appointmentForm(a = {}) {
  return `
    <div class="field"><label for="afPatient">Patient name</label><input id="afPatient" type="text" value="${escapeHtml(a.patient || "")}" placeholder="e.g. Deepa Hegde"></div>
    <div class="field"><label for="afDept">Department</label>
      <select id="afDept">${departments.map((d) => `<option ${d.name === a.dept ? "selected" : ""}>${d.name}</option>`).join("")}</select>
    </div>
    <div class="field"><label for="afWhen">Date &amp; time</label><input id="afWhen" type="text" value="${escapeHtml(a.when || "")}" placeholder="e.g. 16 Jul · 10:30 AM"></div>
    <div class="field"><label for="afStatus">Status</label>
      <select id="afStatus">${["Confirmed", "Pending", "Cancelled"].map((s) => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select>
    </div>`;
}

function readAppointmentForm() {
  const patient = $("#afPatient").value.trim();
  const when    = $("#afWhen").value.trim();
  if (!patient || !when) { showToast("Patient name and slot are required.", true); return null; }
  return { patient, dept: $("#afDept").value, when, status: $("#afStatus").value };
}

function handleAppointmentActions() {
  $("#apptSearch").addEventListener("input", renderDoctorAppointments);
  $("#apptFilter").addEventListener("change", renderDoctorAppointments);

  $("#addApptBtn").addEventListener("click", () =>
    openModal({
      title: "Add appointment",
      sub: "The front desk is notified automatically.",
      body: appointmentForm(),
      actions: [
        { label: "Cancel", onClick: closeModal },
        { label: "Add booking", cls: "btn--primary", onClick: () => {
            const data = readAppointmentForm();
            if (!data) return;
            appointments.unshift({ id: Date.now(), ...data });
            persistAppointments(); renderDoctorAppointments(); renderStats();
            closeModal(); showToast("Appointment added.");
          } },
      ],
    })
  );

  $("#dApptRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const appt = appointments.find((a) => a.id === Number(btn.closest("tr").dataset.id));
    if (!appt) return;

    if (btn.dataset.act === "edit") {
      openModal({
        title: "Edit appointment",
        sub: `${appt.patient} · ${appt.when}`,
        body: appointmentForm(appt),
        actions: [
          { label: "Discard", onClick: closeModal },
          { label: "Save changes", cls: "btn--primary", onClick: () => {
              const data = readAppointmentForm();
              if (!data) return;
              Object.assign(appt, data);
              persistAppointments(); renderDoctorAppointments(); renderStats();
              closeModal(); showToast("Appointment updated.");
            } },
        ],
      });
    }

    if (btn.dataset.act === "delete") {
      openModal({
        title: "Delete this appointment?",
        sub: `${appt.patient} · ${appt.dept} · ${appt.when}`,
        body: "<p>This removes the booking permanently. The patient will receive a cancellation SMS.</p>",
        actions: [
          { label: "Keep it", onClick: closeModal },
          { label: "Delete", cls: "btn--danger", onClick: () => {
              appointments = appointments.filter((a) => a.id !== appt.id);
              persistAppointments(); renderDoctorAppointments(); renderStats();
              closeModal(); showToast("Appointment deleted.");
            } },
        ],
      });
    }
  });
}

/* --------------------------------------------------------------------------
   7. Schedule + medical records
   -------------------------------------------------------------------------- */
function renderSchedule() {
  $("#scheduleList").innerHTML = schedule.map((s) =>
    listItem({ icon: ICONS.clock, name: s.name, meta: s.meta })
  ).join("");
}

function renderDoctorRecords() {
  $("#dRecordList").innerHTML = records.map((r) =>
    listItem({
      icon: ICONS.file,
      name: r.name,
      meta: r.meta,
      actionsHtml: `<div class="row-actions" data-id="${r.id}">
        <button class="btn btn--soft btn--sm" data-act="preview">Preview</button>
        <button class="btn btn--ghost btn--sm" data-act="download">Download</button>
        <button class="btn btn--ghost btn--sm" data-act="update">Update</button>
      </div>`,
    })
  ).join("");
}

function handleRecordActions() {
  $("#uploadRecBtn").addEventListener("click", () =>
    openModal({
      title: "Upload record",
      sub: "PDF, JPG or DICOM up to 20 MB.",
      body: `
        <div class="field"><label for="upName">Document title</label><input id="upName" type="text" placeholder="e.g. Deepa Hegde — ECG strip"></div>
        <div class="field"><label for="upFile">File</label><input id="upFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.dcm"></div>`,
      actions: [
        { label: "Cancel", onClick: closeModal },
        { label: "Upload", cls: "btn--primary", onClick: () => {
            const name = $("#upName").value.trim();
            if (!name) { showToast("Give the document a title first.", true); return; }
            const file = $("#upFile").files[0];
            records.unshift({
              id: Date.now(),
              name,
              meta: `${file ? file.name.split(".").pop().toUpperCase() : "PDF"} · ${file ? (file.size / 1048576).toFixed(1) + " MB" : "—"} · ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
            });
            renderDoctorRecords(); closeModal(); showToast("Record uploaded.");
          } },
      ],
    })
  );

  $("#dRecordList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const rec = records.find((r) => r.id === Number(btn.closest(".row-actions").dataset.id));
    if (!rec) return;

    if (btn.dataset.act === "preview") {
      openModal({
        title: rec.name,
        sub: rec.meta,
        body: `<div class="preview-sheet"><p><b>Stackly Hospital &amp; Clinic — Clinical Document</b></p>
               <p>${escapeHtml(rec.name)}</p>
               <p>Authored under Dr. sign-off workflow. The full document opens in the hospital PACS/DMS viewer in production; this preview shows the metadata card.</p></div>`,
        actions: [{ label: "Close", cls: "btn--primary", onClick: closeModal }],
      });
    }

    if (btn.dataset.act === "download") {
      downloadFile(
        rec.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".txt",
        `STACKLY HOSPITAL & CLINIC\n${rec.name}\n${rec.meta}\n\nExported from the doctor console on ${new Date().toLocaleString("en-IN")}.`
      );
      showToast("Record downloaded.");
    }

    if (btn.dataset.act === "update") {
      openModal({
        title: "Update record",
        sub: rec.meta,
        body: `<div class="field"><label for="updName">Document title</label><input id="updName" type="text" value="${escapeHtml(rec.name)}"></div>`,
        actions: [
          { label: "Discard", onClick: closeModal },
          { label: "Save", cls: "btn--primary", onClick: () => {
              const name = $("#updName").value.trim();
              if (!name) { showToast("Title cannot be empty.", true); return; }
              rec.name = name;
              renderDoctorRecords(); closeModal(); showToast("Record updated.");
            } },
        ],
      });
    }
  });
}

/* --------------------------------------------------------------------------
   8. Prescription builder — add medicines, live preview, save, print
   -------------------------------------------------------------------------- */
const rxState = { patient: "", items: [] };

function renderRxPatients() {
  $("#rxPatient").innerHTML = patients.map((p) => `<option>${escapeHtml(p.name)}</option>`).join("");
  rxState.patient = patients[0]?.name || "";
}

function renderRxPreviewMeta() {
  $("#rxPvPatient").textContent = rxState.patient || "—";
  $("#rxPvDoctor").textContent = session ? session.email : "—";
  $("#rxPvDate").textContent = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function renderRxItems() {
  const html = rxState.items.map((m, i) =>
    listItem({
      icon: ICONS.pill,
      name: m.med,
      meta: `${m.dose} · ${m.days}`,
      actionsHtml: `<button class="btn btn--danger btn--sm" data-rx-remove="${i}">Remove</button>`,
    })
  ).join("");

  $("#rxItems").innerHTML = html;
  $("#rxPreviewList").innerHTML = html || '<p class="empty-note">Add medicines to see the preview.</p>';
}

function handlePrescriptions() {
  renderRxPatients();
  renderRxPreviewMeta();

  $("#rxPatient").addEventListener("change", (e) => {
    rxState.patient = e.target.value;
    renderRxPreviewMeta();
  });

  $("#rxAddBtn").addEventListener("click", () => {
    const med  = $("#rxMed").value.trim();
    const dose = $("#rxDose").value.trim();
    const days = $("#rxDays").value.trim();
    if (!med || !dose || !days) { showToast("Medicine, dosage and duration are all required.", true); return; }

    rxState.items.push({ med, dose, days });
    ["rxMed", "rxDose", "rxDays"].forEach((id) => ($("#" + id).value = ""));
    $("#rxMed").focus();
    renderRxItems();
  });

  // Remove buttons live in both the builder list and the preview
  document.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rx-remove]");
    if (!rm) return;
    rxState.items.splice(Number(rm.dataset.rxRemove), 1);
    renderRxItems();
  });

  $("#rxSaveBtn").addEventListener("click", (e) => {
    if (!rxState.items.length) { showToast("Add at least one medicine before saving.", true); return; }
    withLoading(e.currentTarget, () => {
      const saved = JSON.parse(localStorage.getItem(D_RX_KEY) || "[]");
      saved.unshift({ patient: rxState.patient, items: rxState.items, at: new Date().toISOString() });
      localStorage.setItem(D_RX_KEY, JSON.stringify(saved));
      showToast(`Prescription saved for ${rxState.patient}.`);
    });
  });

  $("#rxPrintBtn").addEventListener("click", () => {
    if (!rxState.items.length) { showToast("Nothing to print yet.", true); return; }
    printSection($("#rxPrintArea"), "Prescription");
  });
}

/* --------------------------------------------------------------------------
   9. Departments, reports, billing
   -------------------------------------------------------------------------- */
function renderDepartments() {
  $("#deptRows").innerHTML = departments.map((d) => `
    <tr>
      <td><b>${d.name}</b></td>
      <td>${d.head}</td>
      <td>${d.opd} patients</td>
      <td>${d.beds}</td>
      <td>${statusPill(d.status)}</td>
    </tr>`).join("");
}

function renderReport() {
  const period = $("#reportPeriod").value;
  $("#reportRows").innerHTML = reportData[period].map(([metric, value, delta]) => `
    <tr><td>${metric}</td><td><b>${value}</b></td>
    <td><span class="pill ${delta.startsWith("−") ? "pill--danger" : delta === "±0" ? "pill--muted" : "pill--ok"}">${delta}</span></td></tr>`).join("");
}

function handleReports() {
  $("#reportPeriod").addEventListener("change", renderReport);

  $("#exportCsvBtn").addEventListener("click", () => {
    const period = $("#reportPeriod").value;
    const csv = "Metric,Value,Vs previous\n" +
      reportData[period].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    downloadFile(`stackly-report-${period}.csv`, csv, "text/csv");
    showToast("Report exported as Excel-compatible CSV.");
  });

  $("#exportPdfBtn").addEventListener("click", () => {
    printSection($("#reportPrintArea"), `Practice report — ${$("#reportPeriod").value}`);
  });
}

function renderBilling() {
  $("#billingRows").innerHTML = billing.map((b) => `
    <tr>
      <td><span class="mono">${b.id}</span></td>
      <td>${escapeHtml(b.patient)}</td>
      <td>${escapeHtml(b.service)}</td>
      <td><b>${fmtINR(b.amount)}</b></td>
      <td>${statusPill(b.status)}</td>
      <td><div class="row-actions">
        <button class="btn btn--soft btn--sm" data-inv="${b.id}">Invoice</button>
      </div></td>
    </tr>`).join("");

  $("#billingRows").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-inv]");
    if (!btn) return;
    const b = billing.find((x) => x.id === btn.dataset.inv);
    downloadFile(`${b.id}.txt`,
      `STACKLY HOSPITAL & CLINIC — INVOICE\n${b.id}\nPatient: ${b.patient}\nService: ${b.service}\nAmount: ${fmtINR(b.amount)}\nStatus: ${b.status}`);
    showToast(`${b.id} downloaded.`);
  });
}

/* --------------------------------------------------------------------------
   10. Messages — compose, reply, delete, search
   -------------------------------------------------------------------------- */
function renderMessages() {
  const term = $("#msgSearch").value.trim().toLowerCase();
  const rows = messages.filter((m) =>
    !term || m.from.toLowerCase().includes(term) || m.subject.toLowerCase().includes(term) || m.body.toLowerCase().includes(term)
  );

  $("#msgList").innerHTML = rows.map((m) =>
    listItem({
      icon: ICONS.mail,
      name: `${m.subject} — ${m.from}`,
      meta: `${m.time} · ${m.body.slice(0, 72)}…`,
      unread: m.unread,
      actionsHtml: `<div class="row-actions" data-id="${m.id}">
        <button class="btn btn--soft btn--sm" data-act="reply">Reply</button>
        <button class="btn btn--danger btn--sm" data-act="delete">Delete</button>
      </div>`,
    })
  ).join("");

  $("#msgEmpty").hidden = rows.length > 0;
}

function handleMessages() {
  $("#msgSearch").addEventListener("input", renderMessages);

  $("#composeBtn").addEventListener("click", () =>
    openModal({
      title: "Compose message",
      sub: "Internal messaging — staff and departments only.",
      body: `
        <div class="field"><label for="cmTo">To</label><input id="cmTo" type="text" placeholder="e.g. Nursing station, Tower B"></div>
        <div class="field"><label for="cmSub">Subject</label><input id="cmSub" type="text" placeholder="Short subject"></div>
        <div class="field"><label for="cmBody">Message</label><textarea id="cmBody" rows="4" placeholder="Type your message…"></textarea></div>`,
      actions: [
        { label: "Discard", onClick: closeModal },
        { label: "Send", cls: "btn--primary", onClick: () => {
            const to = $("#cmTo").value.trim(), sub = $("#cmSub").value.trim(), body = $("#cmBody").value.trim();
            if (!to || !sub || !body) { showToast("All three fields are required.", true); return; }
            messages.unshift({ id: Date.now(), from: `You → ${to}`, subject: sub, body, time: "Just now", unread: false });
            renderMessages(); closeModal(); showToast("Message sent.");
          } },
      ],
    })
  );

  $("#msgList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const msg = messages.find((m) => m.id === Number(btn.closest(".row-actions").dataset.id));
    if (!msg) return;

    if (btn.dataset.act === "reply") {
      msg.unread = false;
      openModal({
        title: `Reply — ${msg.subject}`,
        sub: `Original from ${msg.from}, ${msg.time}`,
        body: `
          <blockquote class="quote">${escapeHtml(msg.body)}</blockquote>
          <div class="field"><label for="rpBody">Your reply</label><textarea id="rpBody" rows="4" placeholder="Type your reply…"></textarea></div>`,
        actions: [
          { label: "Discard", onClick: closeModal },
          { label: "Send reply", cls: "btn--primary", onClick: () => {
              if (!$("#rpBody").value.trim()) { showToast("Reply cannot be empty.", true); return; }
              renderMessages(); closeModal(); showToast("Reply sent.");
            } },
        ],
      });
    }

    if (btn.dataset.act === "delete") {
      messages = messages.filter((m) => m.id !== msg.id);
      renderMessages();
      showToast("Message deleted.");
    }
  });
}

/* --------------------------------------------------------------------------
   11. Notifications
   -------------------------------------------------------------------------- */
function renderNotifications() {
  $("#notifList").innerHTML = notifications.map((n) =>
    listItem({ icon: ICONS.bell, name: n.name, meta: n.meta, unread: n.unread })
  ).join("");
  const unread = notifications.filter((n) => n.unread).length;
  $("#notifCount").textContent = unread;
  $("#notifCount").hidden = unread === 0;
}

function handleNotifications() {
  $("#markReadBtn").addEventListener("click", () => {
    notifications.forEach((n) => (n.unread = false));
    renderNotifications();
    showToast("All notifications marked as read.");
  });
}

/* --------------------------------------------------------------------------
   12. Settings
   -------------------------------------------------------------------------- */
function initSettings() {
  // Hydrate saved values
  try {
    const saved = JSON.parse(localStorage.getItem(D_SET_KEY));
    if (saved) {
      $("#hsName").value = saved.name;
      $("#hsEmail").value = saved.email;
      $("#hsLang").value = saved.lang;
      $("#alertSwitch").checked = saved.alerts;
      $("#digestSwitch").checked = saved.digest;
    }
  } catch { /* first run — defaults stand */ }

  // Theme switch mirrors the topbar toggle
  const syncThemeSwitch = () =>
    ($("#themeSwitch").checked = document.documentElement.getAttribute("data-theme") === "dark");
  syncThemeSwitch();
  document.addEventListener("themechange", syncThemeSwitch);
  $("#themeSwitch").addEventListener("change", toggleTheme);

  $("#hsLogo").addEventListener("change", (e) => {
    if (e.target.files[0]) showToast(`Logo "${e.target.files[0].name}" ready — applied on save.`);
  });

  $("#saveSettingsBtn").addEventListener("click", (e) => {
    const email = $("#hsEmail").value.trim();
    const emailField = $("#hsEmail").closest(".field");
    const bad = !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    emailField.classList.toggle("has-error", bad);
    $(".field-error", emailField).textContent = bad ? "Enter a valid email address." : "";
    if (bad) return;

    withLoading(e.currentTarget, () => {
      localStorage.setItem(D_SET_KEY, JSON.stringify({
        name: $("#hsName").value.trim(),
        email,
        lang: $("#hsLang").value,
        alerts: $("#alertSwitch").checked,
        digest: $("#digestSwitch").checked,
      }));
      showToast("Settings saved.");
    });
  });

  $("#savePrefsBtn").addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem(D_SET_KEY) || "{}");
    saved.alerts = $("#alertSwitch").checked;
    saved.digest = $("#digestSwitch").checked;
    localStorage.setItem(D_SET_KEY, JSON.stringify(saved));
    showToast("Preferences saved.");
  });
}

/* --------------------------------------------------------------------------
   13. Global search — routes the query to the most likely view
   -------------------------------------------------------------------------- */
function initGlobalSearch() {
  $("#globalSearch").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;

    let target = "patients";
    if (q.includes("invoice") || q.includes("bill")) target = "billing";
    else if (q.includes("msg") || q.includes("message")) target = "messages";
    else if (q.includes("appoint") || q.includes("slot")) target = "appointments";
    else if (q.includes("record") || q.includes("report")) target = "records";

    window.location.hash = target;

    // Seed the in-view search box where one exists
    const box = { patients: "#patientSearch", appointments: "#apptSearch", messages: "#msgSearch" }[target];
    if (box) {
      $(box).value = q.replace(/(invoice|bill|msg|message|appoint|slot|record|report)s?/g, "").trim();
      $(box).dispatchEvent(new Event("input"));
    }
    showToast(`Searching in ${target}.`);
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
    `Signed in ${loginDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Today's clinical snapshot.`;

  renderStats();
  renderQueuePreview();
  renderPatients();
  renderDoctorAppointments();
  renderSchedule();
  renderDoctorRecords();
  renderDepartments();
  renderReport();
  renderBilling();
  renderMessages();
  renderNotifications();

  handlePatientActions();
  handleAppointmentActions();
  handleRecordActions();
  handlePrescriptions();
  handleReports();
  handleMessages();
  handleNotifications();
  initSettings();
  initGlobalSearch();

  initRouter("dashboard");
  initCharts();
});