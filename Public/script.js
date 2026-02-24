document.addEventListener("DOMContentLoaded", () => {

  console.log("SmartLeave AI loaded");

  const API_BASE = "http://localhost:3000";

  // ─────────────────────────────────────────────
  //  LOCAL DATA STORE  (replaces backend while offline)
  // ─────────────────────────────────────────────
  let leaveRequests = JSON.parse(localStorage.getItem("sl_requests") || "[]");
  let currentUser   = JSON.parse(localStorage.getItem("sl_user")     || "null");

  function saveRequests() {
    localStorage.setItem("sl_requests", JSON.stringify(leaveRequests));
  }

  // ─────────────────────────────────────────────
  //  SAMPLE DATA
  // ─────────────────────────────────────────────
  const HOLIDAYS = [
    { name: "Independence Day",  date: "2025-08-15" },
    { name: "Gandhi Jayanti",    date: "2025-10-02" },
    { name: "Diwali",            date: "2025-10-20" },
    { name: "Christmas Day",     date: "2025-12-25" },
    { name: "New Year's Day",    date: "2026-01-01" },
  ];

  const TEAM_MEMBERS = [
    { name: "Priya Sharma",  status: "present" },
    { name: "Rahul Mehta",   status: "leave"   },
    { name: "Ananya Singh",  status: "present" },
    { name: "Karan Patel",   status: "remote"  },
    { name: "Divya Nair",    status: "present" },
  ];

  const WORKLOAD_DATA = [
    { name: "Priya Sharma",  pct: 82, color: "#ef4444" },
    { name: "Ananya Singh",  pct: 65, color: "#f59e0b" },
    { name: "Karan Patel",   pct: 48, color: "#10b981" },
    { name: "Divya Nair",    pct: 55, color: "#10b981" },
    { name: "You",           pct: 70, color: "#4f46e5" },
  ];

  const CAPACITY_WEEKS = [
    { label: "W1", pct: 90 }, { label: "W2", pct: 78 },
    { label: "W3", pct: 65 }, { label: "W4", pct: 72 },
    { label: "W5", pct: 58 }, { label: "W6", pct: 84 },
  ];

  // ─────────────────────────────────────────────
  //  NAVBAR SCROLL
  // ─────────────────────────────────────────────
  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 10);
  });

  // ─────────────────────────────────────────────
  //  CAROUSEL
  // ─────────────────────────────────────────────
  const track   = document.querySelector(".carousel-track");
  const slides  = document.querySelectorAll(".slide");
  const dots    = document.querySelectorAll(".dot");
  const nextBtn = document.querySelector(".arrow.right");
  const prevBtn = document.querySelector(".arrow.left");

  if (track && slides.length) {
    let idx = 0;

    function goTo(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, j) => d.classList.toggle("active", j === idx));
    }

    nextBtn?.addEventListener("click", () => goTo(idx + 1));
    prevBtn?.addEventListener("click", () => goTo(idx - 1));
    dots.forEach((d, i) => d.addEventListener("click", () => goTo(i)));

    // Swipe
    let tx = 0;
    track.addEventListener("touchstart", e => { tx = e.touches[0].clientX; });
    track.addEventListener("touchend",   e => {
      const d = tx - e.changedTouches[0].clientX;
      if (Math.abs(d) > 50) goTo(d > 0 ? idx + 1 : idx - 1);
    });

    setInterval(() => goTo(idx + 1), 4000);
  }

  // ─────────────────────────────────────────────
  //  SECTION NAVIGATION
  // ─────────────────────────────────────────────
  const landingPage    = document.getElementById("landingPage");
  const appContainer   = document.getElementById("appContainer");
  const appNav         = document.getElementById("appNav");
  const navLinks       = document.querySelectorAll(".nav-link");

  function showSection(sectionId) {
    document.querySelectorAll(".app-section").forEach(s => s.classList.remove("active-section"));
    const target = document.getElementById("sec-" + sectionId);
    if (target) {
      target.classList.add("active-section");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    navLinks.forEach(l => l.classList.toggle("active", l.dataset.section === sectionId));

    // Refresh data for each section
    if (sectionId === "dashboard")    renderDashboard();
    if (sectionId === "leaveRequest") renderMyRequests();
    if (sectionId === "workload")     renderWorkload();
    if (sectionId === "managerDash")  renderManagerDash();
    if (sectionId === "leaveHistory") renderHistory();
  }

  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const s = link.dataset.section;
      if (s === "managerDash" && currentUser?.role !== "manager") {
        showToast("Manager access only", "error"); return;
      }
      showSection(s);
    });
  });

  // Feature cards on landing page
  document.querySelectorAll(".feature-card[data-open]").forEach(card => {
    card.addEventListener("click", () => {
      if (!currentUser) {
        document.getElementById("authModal").classList.add("show"); return;
      }
      const s = card.dataset.open;
      if (s === "managerDash" && currentUser.role !== "manager") {
        showToast("Manager access only", "error"); return;
      }
      landingPage.classList.add("hidden");
      appContainer.classList.remove("hidden");
      appNav.classList.remove("hidden");
      showSection(s);
    });
  });

  // CTA button
  document.getElementById("ctaBtn")?.addEventListener("click", () => {
    if (currentUser) {
      landingPage.classList.add("hidden");
      appContainer.classList.remove("hidden");
      appNav.classList.remove("hidden");
      showSection("dashboard");
    } else {
      document.getElementById("authModal").classList.add("show");
    }
  });

  // ─────────────────────────────────────────────
  //  MODAL
  // ─────────────────────────────────────────────
  const modal      = document.getElementById("authModal");
  const loginBtn   = document.getElementById("loginBtn");
  const logoutBtn  = document.getElementById("logoutBtn");
  const loginForm  = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  loginBtn?.addEventListener("click", () => modal.classList.add("show"));

  modal?.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") modal.classList.remove("show");
  });

  document.getElementById("showSignup")?.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
  });
  document.getElementById("showLogin")?.addEventListener("click", () => {
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });

  // ─────────────────────────────────────────────
  //  AUTH – SIGNUP
  // ─────────────────────────────────────────────
  document.getElementById("signupSubmit")?.addEventListener("click", async () => {
    const username = document.getElementById("signupUsername").value.trim();
    const email    = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPass").value.trim();
    const repass   = document.getElementById("signupRepass").value.trim();
    const role     = document.getElementById("signupRole").value;

    if (!username || !email || !password || !repass) return showToast("All fields required", "error");
    if (!isValidEmail(email))      return showToast("Enter a valid email", "error");
    if (password.length < 6)       return showToast("Password must be 6+ characters", "error");
    if (password !== repass)       return showToast("Passwords do not match", "error");

    const btn = document.getElementById("signupSubmit");
    btn.textContent = "Creating..."; btn.disabled = true;

    try {
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Account created! Please log in.", "success");
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        clearSignupFields();
      } else {
        showToast(data.message || "Signup failed", "error");
      }
    } catch {
      // Offline fallback – store locally
      loginAsLocal(username, email, role);
      showToast("Signed up locally (server offline)", "success");
      modal.classList.remove("show");
    } finally {
      btn.textContent = "Create Account"; btn.disabled = false;
    }
  });

  // ─────────────────────────────────────────────
  //  AUTH – LOGIN
  // ─────────────────────────────────────────────
  document.getElementById("loginSubmit")?.addEventListener("click", async () => {
    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPass").value.trim();
    const role     = document.getElementById("loginRole").value;

    if (!email || !password) return showToast("Email and password required", "error");
    if (!isValidEmail(email)) return showToast("Enter a valid email", "error");

    const btn = document.getElementById("loginSubmit");
    btn.textContent = "Logging in..."; btn.disabled = true;

    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        loginAsLocal(data.user?.name || email.split("@")[0], email, role);
        modal.classList.remove("show");
        showToast(`Welcome back! Logged in as ${role}.`, "success");
      } else {
        showToast(data.message || "Invalid credentials", "error");
      }
    } catch {
      // Offline demo login
      loginAsLocal(email.split("@")[0], email, role);
      modal.classList.remove("show");
      showToast(`Demo login as ${role} (server offline)`, "success");
    } finally {
      btn.textContent = "Login"; btn.disabled = false;
      document.getElementById("loginEmail").value = "";
      document.getElementById("loginPass").value  = "";
    }
  });

  // ─────────────────────────────────────────────
  //  AUTH HELPERS
  // ─────────────────────────────────────────────
  function loginAsLocal(name, email, role) {
    currentUser = { name, email, role };
    localStorage.setItem("sl_user", JSON.stringify(currentUser));
    updateNavbar();
    enterApp();
  }

  function enterApp() {
    landingPage.classList.add("hidden");
    appContainer.classList.remove("hidden");
    appNav.classList.remove("hidden");
    showSection("dashboard");
  }

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("sl_user");
    currentUser = null;
    updateNavbar();
    appContainer.classList.add("hidden");
    appNav.classList.add("hidden");
    landingPage.classList.remove("hidden");
    showToast("Logged out successfully.", "success");
  });

  function updateNavbar() {
    const loggedIn = !!currentUser;
    loginBtn.classList.toggle("hidden", loggedIn);
    logoutBtn.classList.toggle("hidden", !loggedIn);

    const badge = document.getElementById("userBadge");
    if (loggedIn) {
      badge.classList.remove("hidden");
      badge.textContent = `${currentUser.name}  ·  ${currentUser.role}`;
    } else {
      badge.classList.add("hidden");
    }

    // Show/hide manager nav link
    document.querySelectorAll(".manager-only").forEach(el => {
      el.classList.toggle("hidden", currentUser?.role !== "manager");
    });
  }

  // Restore session on reload
  if (currentUser) {
    updateNavbar();
    enterApp();
  }

  // ─────────────────────────────────────────────
  //  1. DASHBOARD
  // ─────────────────────────────────────────────
  function renderDashboard() {
    // User name
    document.getElementById("dashUserName").textContent = currentUser?.name || "User";

    // Counts
    const pending  = leaveRequests.filter(r => r.user === currentUser?.email && r.status === "pending").length;
    const approved = leaveRequests.filter(r => r.user === currentUser?.email && r.status === "approved").length;
    document.getElementById("pendingCount").textContent  = pending;
    document.getElementById("approvedCount").textContent = approved;

    // Holidays
    const hl = document.getElementById("holidayList");
    hl.innerHTML = "";
    const today = new Date();
    const upcoming = HOLIDAYS.filter(h => new Date(h.date) >= today).slice(0, 5);
    upcoming.forEach(h => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${h.name}</span><span class="holiday-date">${formatDate(h.date)}</span>`;
      hl.appendChild(li);
    });
    if (!upcoming.length) hl.innerHTML = '<li class="empty-msg">No upcoming holidays.</li>';

    // Team list
    const tl = document.getElementById("teamList");
    tl.innerHTML = "";
    TEAM_MEMBERS.forEach(m => {
      const li = document.createElement("li");
      const dotClass = m.status === "present" ? "green" : m.status === "leave" ? "red" : "yellow";
      const label    = m.status === "present" ? "In Office" : m.status === "leave" ? "On Leave" : "Remote";
      li.innerHTML = `<span>${m.name}</span><span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b"><span class="team-dot ${dotClass}"></span>${label}</span>`;
      tl.appendChild(li);
    });

    // Activity feed
    const al = document.getElementById("activityList");
    const myReqs = leaveRequests.filter(r => r.user === currentUser?.email).slice(-5).reverse();
    if (!myReqs.length) {
      al.innerHTML = '<li class="empty-msg">No recent activity.</li>';
    } else {
      al.innerHTML = "";
      myReqs.forEach(r => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${capitalize(r.type)} leave – ${capitalize(r.status)}</span><span class="holiday-date">${formatDate(r.start)}</span>`;
        al.appendChild(li);
      });
    }
  }

  // ─────────────────────────────────────────────
  //  2. LEAVE REQUEST PORTAL
  // ─────────────────────────────────────────────
  const leaveStart = document.getElementById("leaveStart");
  const leaveEnd   = document.getElementById("leaveEnd");
  const durPrev    = document.getElementById("durationPreview");

  // Set min date = today
  const todayStr = new Date().toISOString().split("T")[0];
  if (leaveStart) leaveStart.min = todayStr;
  if (leaveEnd)   leaveEnd.min   = todayStr;

  function calcDays() {
    if (!leaveStart?.value || !leaveEnd?.value) return 0;
    const s = new Date(leaveStart.value);
    const e = new Date(leaveEnd.value);
    return Math.max(0, Math.round((e - s) / 86400000) + 1);
  }

  function updateDurationPreview() {
    const days = calcDays();
    if (days > 0 && durPrev) {
      durPrev.style.display = "block";
      durPrev.textContent   = `📅  ${days} working day${days > 1 ? "s" : ""} selected`;
    } else if (durPrev) {
      durPrev.style.display = "none";
    }
    // Sync end min date
    if (leaveEnd && leaveStart?.value) leaveEnd.min = leaveStart.value;
  }

  leaveStart?.addEventListener("change", updateDurationPreview);
  leaveEnd?.addEventListener("change",   updateDurationPreview);

  document.getElementById("submitLeaveBtn")?.addEventListener("click", () => {
    const type     = document.getElementById("leaveType").value;
    const priority = document.getElementById("leavePriority").value;
    const start    = leaveStart?.value;
    const end      = leaveEnd?.value;
    const reason   = document.getElementById("leaveReason").value.trim();
    const cover    = document.getElementById("leaveCover").value.trim();

    if (!start || !end)  return showToast("Please select start and end dates", "error");
    if (new Date(end) < new Date(start)) return showToast("End date must be after start date", "error");
    if (!reason)         return showToast("Please provide a reason", "error");

    const days = calcDays();
    const req  = {
      id:       Date.now(),
      user:     currentUser?.email || "demo@user.com",
      userName: currentUser?.name  || "Demo User",
      type, priority, start, end, days, reason, cover,
      status:   "pending",
      submitted: new Date().toISOString().split("T")[0],
      decided:  "—"
    };

    leaveRequests.push(req);
    saveRequests();

    showToast("Leave request submitted successfully! ✅", "success");

    // Reset form
    document.getElementById("leaveReason").value = "";
    document.getElementById("leaveCover").value  = "";
    leaveStart.value = ""; leaveEnd.value = "";
    if (durPrev) durPrev.style.display = "none";

    renderMyRequests();
    renderDashboard();
  });

  function renderMyRequests() {
    const tbody = document.getElementById("myRequestsBody");
    if (!tbody) return;
    const mine = leaveRequests.filter(r =>
      r.user === (currentUser?.email || "") && ["pending","approved"].includes(r.status)
    );
    if (!mine.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No active requests.</td></tr>';
      return;
    }
    tbody.innerHTML = mine.reverse().map(r => `
      <tr>
        <td>${capitalize(r.type)}</td>
        <td>${formatDate(r.start)}</td>
        <td>${formatDate(r.end)}</td>
        <td>${r.days}</td>
        <td><span class="badge badge-${r.priority}">${capitalize(r.priority)}</span></td>
        <td><span class="badge badge-${r.status}">${capitalize(r.status)}</span></td>
        <td>${r.status === "pending"
          ? `<button class="btn-cancel" onclick="cancelRequest(${r.id})">Cancel</button>`
          : "—"}</td>
      </tr>
    `).join("");
  }

  window.cancelRequest = function(id) {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;
    req.status  = "cancelled";
    req.decided = new Date().toISOString().split("T")[0];
    saveRequests();
    renderMyRequests();
    renderDashboard();
    renderHistory();
    showToast("Request cancelled.", "success");
  };

  // ─────────────────────────────────────────────
  //  3. WORKLOAD ANALYZER
  // ─────────────────────────────────────────────
  function renderWorkload() {
    const onLeave = TEAM_MEMBERS.filter(m => m.status === "leave").length;
    const active  = TEAM_MEMBERS.length - onLeave;
    const capPct  = Math.round((active / TEAM_MEMBERS.length) * 100);

    document.getElementById("wl-active").textContent = active;
    document.getElementById("wl-leave").textContent  = onLeave;
    document.getElementById("wl-tasks").textContent  = 24;

    const risk = capPct < 60 ? "High" : capPct < 80 ? "Medium" : "Low";
    const riskEl = document.getElementById("wl-risk");
    riskEl.textContent = risk;
    riskEl.style.color = risk === "High" ? "#ef4444" : risk === "Medium" ? "#f59e0b" : "#10b981";

    // Member breakdown
    const list = document.getElementById("memberWorkloadList");
    if (list) {
      list.innerHTML = WORKLOAD_DATA.map(m => `
        <div class="member-workload-item">
          <div class="mw-name">${m.name}</div>
          <div class="mw-bar-bg">
            <div class="mw-bar" style="width:${m.pct}%;background:${m.color}"></div>
          </div>
          <div class="mw-pct">${m.pct}%</div>
        </div>
      `).join("");
    }

    // AI Recommendation
    const rec = document.getElementById("aiRecommendation");
    if (rec) {
      const msgs = {
        High:   "⚠️ <strong>High Risk:</strong> Team capacity is critically low. Consider redistributing tasks, postponing non-critical deadlines, or onboarding temporary support. Avoid approving further leave requests this week.",
        Medium: "⚡ <strong>Moderate Load:</strong> The team is operating near capacity. Monitor workloads closely and ensure priorities are aligned. Evaluate any new leave requests carefully.",
        Low:    "✅ <strong>Team Healthy:</strong> Current workload distribution is balanced. The team can comfortably handle upcoming tasks. Leave approvals can proceed as normal."
      };
      rec.innerHTML = msgs[risk];
    }

    // Capacity chart
    const chart = document.getElementById("capacityChart");
    if (chart) {
      chart.innerHTML = CAPACITY_WEEKS.map(w => `
        <div class="cap-bar-wrap">
          <div class="cap-bar" style="height:${w.pct}%"></div>
          <div class="cap-label">${w.label}</div>
        </div>
      `).join("");
    }
  }

  // ─────────────────────────────────────────────
  //  4. MANAGER DASHBOARD
  // ─────────────────────────────────────────────
  function renderManagerDash() {
    const filter = document.getElementById("mgrFilter")?.value || "all";
    let   reqs   = [...leaveRequests];
    if (filter !== "all") reqs = reqs.filter(r => r.status === filter);

    const pending  = leaveRequests.filter(r => r.status === "pending").length;
    const approved = leaveRequests.filter(r => r.status === "approved").length;
    const rejected = leaveRequests.filter(r => r.status === "rejected").length;

    document.getElementById("mgr-pending").textContent  = pending;
    document.getElementById("mgr-approved").textContent = approved;
    document.getElementById("mgr-rejected").textContent = rejected;

    const tbody = document.getElementById("mgrTableBody");
    if (!tbody) return;

    if (!reqs.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">No requests found.</td></tr>';
      return;
    }

    tbody.innerHTML = reqs.reverse().map(r => `
      <tr>
        <td>${r.userName || r.user}</td>
        <td>${capitalize(r.type)}</td>
        <td>${formatDate(r.start)}</td>
        <td>${formatDate(r.end)}</td>
        <td>${r.days}</td>
        <td><span class="badge badge-${r.priority}">${capitalize(r.priority)}</span></td>
        <td><span class="badge badge-${r.status}">${capitalize(r.status)}</span></td>
        <td>
          ${r.status === "pending" ? `
            <button class="btn-approve" onclick="managerDecide(${r.id},'approved')">✓ Approve</button>
            <button class="btn-reject"  onclick="managerDecide(${r.id},'rejected')">✗ Reject</button>
          ` : "—"}
        </td>
      </tr>
    `).join("");
  }

  window.managerDecide = function(id, decision) {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;
    req.status  = decision;
    req.decided = new Date().toISOString().split("T")[0];

    // Adjust leave balance if approved
    if (decision === "approved" && req.user === currentUser?.email) {
      if (req.type === "sick") {
        const el = document.getElementById("sickBalance");
        if (el) el.textContent = Math.max(0, parseInt(el.textContent) - req.days);
      } else if (req.type === "annual") {
        const el = document.getElementById("annualBalance");
        if (el) el.textContent = Math.max(0, parseInt(el.textContent) - req.days);
      }
    }

    saveRequests();
    renderManagerDash();
    showToast(`Request ${decision === "approved" ? "✅ approved" : "❌ rejected"}.`, decision === "approved" ? "success" : "error");
  };

  document.getElementById("mgrFilter")?.addEventListener("change", renderManagerDash);

  // ─────────────────────────────────────────────
  //  5. LEAVE HISTORY
  // ─────────────────────────────────────────────
  function renderHistory() {
    const filterVal = document.getElementById("historyFilter")?.value || "all";
    const yearVal   = document.getElementById("historyYear")?.value   || "2025";

    let records = leaveRequests.filter(r => r.user === currentUser?.email);
    if (filterVal !== "all") records = records.filter(r => r.status === filterVal);
    records = records.filter(r => r.start?.startsWith(yearVal));

    const tbody = document.getElementById("historyBody");
    if (!tbody) return;

    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No records found.</td></tr>';
      return;
    }

    tbody.innerHTML = records.reverse().map(r => `
      <tr>
        <td>${capitalize(r.type)}</td>
        <td>${formatDate(r.start)}</td>
        <td>${formatDate(r.end)}</td>
        <td>${r.days}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.reason}">${r.reason}</td>
        <td><span class="badge badge-${r.status}">${capitalize(r.status)}</span></td>
        <td>${r.decided || "—"}</td>
      </tr>
    `).join("");
  }

  document.getElementById("historyFilter")?.addEventListener("change", renderHistory);
  document.getElementById("historyYear")?.addEventListener("change",   renderHistory);

  // ─────────────────────────────────────────────
  //  EXPORT CSV
  // ─────────────────────────────────────────────
  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const records = leaveRequests.filter(r => r.user === currentUser?.email);
    if (!records.length) return showToast("No records to export.", "error");

    const headers = ["Type","From","To","Days","Reason","Status","Decided"];
    const rows    = records.map(r =>
      [r.type, r.start, r.end, r.days, `"${r.reason}"`, r.status, r.decided || ""].join(",")
    );
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "leave_history.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!", "success");
  });

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatDate(dateStr) {
    if (!dateStr || dateStr === "—") return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function clearSignupFields() {
    ["signupUsername","signupEmail","signupPass","signupRepass"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }

  function showToast(message, type = "success") {
    const old = document.getElementById("sl-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "sl-toast";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed", bottom: "28px", left: "50%",
      transform: "translateX(-50%)",
      padding: "13px 26px", borderRadius: "14px",
      fontFamily: "Inter, sans-serif", fontWeight: "600", fontSize: "14px",
      color: "white",
      background: type === "success" ? "#10b981" : "#ef4444",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      zIndex: "9999", opacity: "1", transition: "opacity 0.4s ease",
      whiteSpace: "nowrap"
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 400); }, 3000);
  }

});
