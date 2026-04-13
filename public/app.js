/* ─────────────────────────────────────────────────────────────────────
   Acadex — Frontend Logic
   Handles: tab navigation, CRUD forms, toast, results filter + grades
   ───────────────────────────────────────────────────────────────────── */

"use strict";

// ── DOM refs ─────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const studentForm       = $("studentForm");
const studentIdInput    = $("studentId");
const studentName       = $("studentName");
const studentEmail      = $("studentEmail");
const studentDepartment = $("studentDepartment");
const studentYear       = $("studentYear");
const studentSubmit     = $("studentSubmit");
const studentCancel     = $("studentCancel");
const studentFormTitle  = $("studentFormTitle");

const courseForm        = $("courseForm");
const enrollmentForm    = $("enrollmentForm");
const resultForm        = $("resultForm");

const resultsFilterStudent = $("resultsFilterStudent");
const resultsBody          = $("resultsBody");
const resultsBadge         = $("resultsBadge");

const loadingOverlay = $("loadingOverlay");
const toastBar       = $("toastBar");
const toastText      = $("toastText");
const toastIcon      = $("toastIcon");

// ── Tab system ────────────────────────────────────────────────────────
const tabBtns   = document.querySelectorAll(".nav-item");
const tabPanels = document.querySelectorAll(".tab-panel");

const activeTabId = localStorage.getItem("activeTabId") || "tab-students";

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("aria-controls");
    localStorage.setItem("activeTabId", btn.id);

    tabBtns.forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    tabPanels.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    document.getElementById(targetId).classList.add("active");
  });
});

const savedBtn = document.getElementById(activeTabId);
if (savedBtn) {
  // Briefly remove animation from tab panels to prevent flash
  tabPanels.forEach(p => p.style.animation = 'none');
  savedBtn.click();
  setTimeout(() => tabPanels.forEach(p => p.style.animation = ''), 50);
}

// ── Loading helpers ───────────────────────────────────────────────────
function showLoading() { loadingOverlay.classList.add("show"); }
function hideLoading() { loadingOverlay.classList.remove("show"); }

// ── Toast notification ────────────────────────────────────────────────
let toastTimer;

const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_X     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toastBar.className = "toast-bar " + (isError ? "error" : "success");
  toastIcon.innerHTML = isError ? ICON_X : ICON_CHECK;
  toastText.textContent = message;
  toastBar.classList.add("show");
  toastTimer = setTimeout(() => toastBar.classList.remove("show"), 3800);
}

// ── HTTP helper ───────────────────────────────────────────────────────
async function sendJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

// ── Reload with loading overlay ───────────────────────────────────────
function reloadPage() {
  showLoading();
  window.location.reload();
}

// ── Student Form ──────────────────────────────────────────────────────
function resetStudentForm() {
  studentIdInput.value = "";
  studentForm.reset();
  studentSubmit.textContent = "Add Student";
  studentFormTitle.textContent = "Add Student";
  studentSubmit.querySelector("svg").outerHTML; // keep icon
  studentCancel.hidden = true;
}

studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    name:       studentName.value.trim(),
    email:      studentEmail.value.trim(),
    department: studentDepartment.value.trim(),
    year:       Number(studentYear.value),
  };

  if (!body.name || !body.email || !body.department || !body.year) {
    showToast("Please fill in all fields.", true);
    return;
  }

  const id = studentIdInput.value;
  showLoading();

  try {
    if (id) {
      await sendJson(`/students/${id}`, { method: "PUT", body: JSON.stringify(body) });
      showToast("Student updated successfully.");
    } else {
      await sendJson("/students", { method: "POST", body: JSON.stringify(body) });
      showToast("Student added successfully.");
    }
    reloadPage();
  } catch (err) {
    hideLoading();
    showToast(err.message, true);
  }
});

studentCancel.addEventListener("click", resetStudentForm);

document.querySelectorAll(".edit-student").forEach((btn) => {
  btn.addEventListener("click", () => {
    studentIdInput.value    = btn.dataset.id;
    studentName.value       = btn.dataset.name;
    studentEmail.value      = btn.dataset.email;
    studentDepartment.value = btn.dataset.department;
    studentYear.value       = btn.dataset.year;
    studentSubmit.textContent = "Update Student";
    studentFormTitle.textContent = "Edit Student";
    studentCancel.hidden = false;

    // Switch to Students tab if not already active
    $("tab-students").click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

document.querySelectorAll(".delete-student").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!window.confirm("Delete this student and all related records?")) return;

    showLoading();
    try {
      await sendJson(`/students/${btn.dataset.id}`, { method: "DELETE" });
      showToast("Student deleted successfully.");
      reloadPage();
    } catch (err) {
      hideLoading();
      showToast(err.message, true);
    }
  });
});

document.querySelectorAll(".delete-course").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!window.confirm("Delete this course and all related enrollments and results?")) return;

    showLoading();
    try {
      await sendJson(`/courses/${btn.dataset.id}`, { method: "DELETE" });
      showToast("Course deleted successfully.");
      reloadPage();
    } catch (err) {
      hideLoading();
      showToast(err.message, true);
    }
  });
});

// ── Course Form ───────────────────────────────────────────────────────
courseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    course_name: $("courseName").value.trim(),
    credits:     Number($("courseCredits").value),
  };

  if (!body.course_name || !body.credits) {
    showToast("Please fill in all course fields.", true);
    return;
  }

  showLoading();
  try {
    await sendJson("/courses", { method: "POST", body: JSON.stringify(body) });
    showToast("Course added successfully.");
    reloadPage();
  } catch (err) {
    hideLoading();
    showToast(err.message, true);
  }
});

// ── Enrollment Form ───────────────────────────────────────────────────
enrollmentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    student_id: $("enrollmentStudent").value,
    course_id:  $("enrollmentCourse").value,
  };

  if (!body.student_id || !body.course_id) {
    showToast("Please select both a student and a course.", true);
    return;
  }

  showLoading();
  try {
    await sendJson("/enrollments", { method: "POST", body: JSON.stringify(body) });
    showToast("Enrollment created successfully.");
    reloadPage();
  } catch (err) {
    hideLoading();
    showToast(err.message, true);
  }
});

// ── Result Form ───────────────────────────────────────────────────────
const resultStudent = $("resultStudent");
const resultCourse = $("resultCourse");

resultStudent.addEventListener("change", () => {
  const sId = resultStudent.value;
  resultCourse.innerHTML = '<option value="">— Select course —</option>';
  
  if (!sId || !window.APP_ENROLLMENTS) return;

  const enrolled = window.APP_ENROLLMENTS.filter(
    (e) => e.student_id && e.student_id._id === sId && e.course_id
  );

  enrolled.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.course_id._id;
    opt.textContent = e.course_id.course_name;
    resultCourse.appendChild(opt);
  });
});

resultForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    student_id: resultStudent.value,
    course_id:  resultCourse.value,
    marks:      Number($("resultMarks").value),
  };

  if (!body.student_id || !body.course_id || isNaN(body.marks)) {
    showToast("Please fill in all result fields.", true);
    return;
  }

  showLoading();
  try {
    await sendJson("/results", { method: "POST", body: JSON.stringify(body) });
    showToast("Marks saved successfully.");
    reloadPage();
  } catch (err) {
    hideLoading();
    showToast(err.message, true);
  }
});

// ── Results filter ────────────────────────────────────────────────────
function gradeFromMarks(m) {
  if (m >= 90) return { label: "A+", color: "#10b981" };
  if (m >= 75) return { label: "A",  color: "#10b981" };
  if (m >= 60) return { label: "B",  color: "#10b981" };
  if (m >= 45) return { label: "C",  color: "#f59e0b" };
  return              { label: "F",  color: "#ef4444" };
}

function pillClass(m) {
  if (m >= 60) return "high";
  if (m >= 40) return "mid";
  return "low";
}

async function fetchResults() {
  const studentId = resultsFilterStudent.value;
  const courseId = $("resultsFilterCourse") ? $("resultsFilterCourse").value : "";

  const params = new URLSearchParams();
  if (studentId) params.append("student", studentId);
  if (courseId) params.append("course", courseId);

  const endpoint = `/results?${params.toString()}`;

  try {
    const results = await sendJson(endpoint, { method: "GET" });

    if (resultsBadge) resultsBadge.textContent = results.length;

    if (!results.length) {
      resultsBody.innerHTML = `
        <tr><td colspan="4">
          <div class="empty-state" style="padding:2rem 1rem">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;margin:0 auto .8rem;display:block;opacity:.3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <p>No results found.</p>
          </div>
        </td></tr>`;
      return;
    }

    resultsBody.innerHTML = results.map((r) => {
      const g = gradeFromMarks(r.marks);
      return `
        <tr>
          <td><strong style="color:var(--text)">${r.student_name || "—"}</strong></td>
          <td>${r.course_name || "—"}</td>
          <td><span class="marks-pill ${pillClass(r.marks)}">${r.marks}</span></td>
          <td><span style="font-weight:700;font-size:.9rem;color:${g.color}">${g.label}</span></td>
        </tr>`;
    }).join("");
  } catch (err) {
    showToast(err.message, true);
  }
}

resultsFilterStudent.addEventListener("change", fetchResults);
if ($("resultsFilterCourse")) $("resultsFilterCourse").addEventListener("change", fetchResults);

// ── Dashboard Charts ──────────────────────────────────────────────────
let enrollmentChartInstance = null;
let gradesChartInstance = null;

function initCharts(branchName = "") {
  if (typeof Chart === 'undefined') return;

  // Filter students by branch if requested
  let validStudentIds = null; // null means all students
  if (branchName && window.APP_STUDENTS) {
    validStudentIds = new Set(
      window.APP_STUDENTS.filter(s => s.department === branchName).map(s => s._id)
    );
  }

  // 1. Enrollment Overview (Bar chart of enrollments per course)
  const ctxDashboard = document.getElementById('dashboardChart');
  if (ctxDashboard && window.APP_COURSES && window.APP_ENROLLMENTS) {
    if (enrollmentChartInstance) enrollmentChartInstance.destroy();

    // Calculate enrollments per course
    const enrollData = {};
    window.APP_COURSES.forEach(c => { enrollData[c._id] = { name: c.course_name, count: 0 }; });
    
    window.APP_ENROLLMENTS.forEach(e => {
      const cId = e.course_id?._id || e.course_id;
      const sId = e.student_id?._id || e.student_id;
      
      // If filtering by branch, skip enrollments of students not in that branch
      if (validStudentIds && !validStudentIds.has(sId)) return;

      if (cId && enrollData[cId]) {
        enrollData[cId].count++;
      }
    });

    const labels = Object.values(enrollData).map(d => d.name);
    const data = Object.values(enrollData).map(d => d.count);

    enrollmentChartInstance = new Chart(ctxDashboard, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Enrollments',
          data: data,
          backgroundColor: 'rgba(99,102,241,0.6)',
          borderColor: 'rgba(99,102,241,1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: '#8899a6' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { color: '#8899a6' }, grid: { display: false } }
        }
      }
    });
  }

  // 2. Grade Distribution (Doughnut chart)
  const ctxGrades = document.getElementById('gradesChart');
  if (ctxGrades && window.APP_RESULTS) {
    if (gradesChartInstance) gradesChartInstance.destroy();

    const grades = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };
    window.APP_RESULTS.forEach(r => {
      const sId = r.student_id?._id || r.student_id;
      if (validStudentIds && !validStudentIds.has(sId)) return;

      const m = r.marks;
      if (m >= 90) grades['A+']++;
      else if (m >= 75) grades['A']++;
      else if (m >= 60) grades['B']++;
      else if (m >= 45) grades['C']++;
      else grades['F']++;
    });

    // Check if we have any results to show at all to avoid an ugly empty doughnut
    const totalGrades = Object.values(grades).reduce((a,b)=>a+b,0);

    gradesChartInstance = new Chart(ctxGrades, {
      type: totalGrades > 0 ? 'doughnut' : 'bar', // fallback to empty bar if no data
      data: {
        labels: Object.keys(grades),
        datasets: [{
          data: Object.values(grades),
          backgroundColor: [
            '#10b981', // A+
            '#34d399', // A
            '#60a5fa', // B
            '#f59e0b', // C
            '#ef4444'  // F
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#e2e8f0' } }
        },
        cutout: '70%'
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  const branchFilter = document.getElementById("branchFilter");
  if (branchFilter) {
    branchFilter.addEventListener("change", (e) => {
      initCharts(e.target.value);
    });
  }

  // Restore scroll position to prevent jumping to top after actions
  const scrollPos = sessionStorage.getItem("scrollPos");
  if (scrollPos) {
    setTimeout(() => window.scrollTo({ top: parseInt(scrollPos), behavior: 'instant' }), 10);
    sessionStorage.removeItem("scrollPos");
  }
});

window.addEventListener("beforeunload", () => {
  sessionStorage.setItem("scrollPos", window.scrollY);
});
