const root = document.getElementById("screenRoot");
const userMeta = document.getElementById("userMeta");
const topLogout = document.getElementById("topLogout");

const USERNAME_EMAIL_DOMAIN = "riyad.local";

/* ===== Supabase Config ===== */
const SUPABASE_URL = "https://uqpumxbiqnccgqkiwzur.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcHVteGJpcW5jY2dxa2l3enVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjkxNDUsImV4cCI6MjA4NjA0NTE0NX0._HK-1dKy7897hQPlrZWAOiwPUB5q8u3X9HPiIQN3WQo";

/* global supabase */
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

let session = null; // { user, role, username }

/* ===== Helpers ===== */
function setScreen(html) {
  root.innerHTML = html;
}
function setHeroBackground(isOn) {
  document.body.classList.toggle("hero-bg", Boolean(isOn));
}
function toEmail(input) {
  const v = (input || "").trim().toLowerCase();
  if (!v) return "";
  if (v.includes("@")) return v;
  return `${v}@${USERNAME_EMAIL_DOMAIN}`;
}

async function loadProfileRole(user) {
  if (!user) return { role: "Viewer", username: "" };

  const { data } = await sb
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  return {
    role: (data?.role || "Viewer").trim(),
    username: (data?.username || user.email.split("@")[0]).trim(),
  };
}

function setLogoutVisible(isVisible) {
  if (!topLogout) return;
  topLogout.style.display = isVisible ? "flex" : "none";
}

/* ===== Screens ===== */
function renderLoading(title = "جاري التحميل...") {
  setHeroBackground(true);
  userMeta.textContent = "";
  setLogoutVisible(false);
  setScreen(`
    <div>
      <h1 class="h1">${title}</h1>
      <p class="p">لحظات...</p>
      <div class="hint-bar"></div>
    </div>
  `);
}

function renderLogin(note = "") {
  setHeroBackground(true);
  userMeta.textContent = "";
  setLogoutVisible(false);

  setScreen(`
    <div>
      <h1 class="h1">تسجيل الدخول</h1>
      <p class="p">الدخول مخصص للمصرّح لهم فقط.</p>
      <div class="hint-bar"></div>

      <div class="field">
        <label>اسم المستخدم</label>
        <input id="u" value="admin@riyad.local" autocomplete="username" />
      </div>

      <div class="field">
        <label>كلمة المرور</label>
        <input id="p" type="password" placeholder="••••••••" autocomplete="new-password" />
      </div>

      <div class="actions">
        <button class="primary" id="loginBtn">دخول</button>
      </div>

      ${note ? `<div class="notice" style="color:#b42318;">${note}</div>` : ""}
    </div>
  `);

  const uEl = document.getElementById("u");
  const pEl = document.getElementById("p");
  const btn = document.getElementById("loginBtn");
  pEl.value = ""; // ensure empty by default

  const onEnter = (e) => e.key === "Enter" && btn.click();
  uEl.addEventListener("keydown", onEnter);
  pEl.addEventListener("keydown", onEnter);

  btn.onclick = async () => {
    const email = toEmail(uEl.value);
    const password = (pEl.value || "").trim();

    if (!password) return renderLogin("الرجاء إدخال كلمة المرور.");

    renderLoading("تسجيل الدخول...");

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return renderLogin("بيانات الدخول غير صحيحة.");

    const user = data.user;
    const profile = await loadProfileRole(user);
    session = { user, role: profile.role, username: profile.username };

    renderMainDashboard();
  };
}

function svgIcon(name) {
  // Minimal outline icons (consistent stroke)
  const common = `fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
  switch (name) {
    case "add_user":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${common} d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <path ${common} d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
        <path ${common} d="M20 8v6"/>
        <path ${common} d="M17 11h6"/>
      </svg>`;
    case "users":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${common} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <path ${common} d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
        <path ${common} d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path ${common} d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`;
    case "check_clipboard":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${common} d="M9 5h6"/>
        <path ${common} d="M9 3h6a2 2 0 0 1 2 2v2H7V5a2 2 0 0 1 2-2z"/>
        <path ${common} d="M7 7h10v14H7z"/>
        <path ${common} d="M9 14l2 2 4-5"/>
      </svg>`;
    case "trophy":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${common} d="M8 4h8v3a4 4 0 0 1-8 0V4z"/>
        <path ${common} d="M6 4H4v3a4 4 0 0 0 4 4"/>
        <path ${common} d="M18 4h2v3a4 4 0 0 1-4 4"/>
        <path ${common} d="M12 11v4"/>
        <path ${common} d="M9 21h6"/>
        <path ${common} d="M10 15h4v6h-4z"/>
      </svg>`;
    case "chart":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${common} d="M4 19V5"/>
        <path ${common} d="M4 19h16"/>
        <path ${common} d="M8 17v-6"/>
        <path ${common} d="M12 17v-10"/>
        <path ${common} d="M16 17v-3"/>
      </svg>`;
    default:
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M4 12h16"/></svg>`;
  }
}

function renderMainDashboard() {
  setHeroBackground(false);
  if (!session?.user) return renderLogin();

  const role = session.role; // Admin | Evaluator | Viewer
  const isAdmin = role === "Admin";
  const isEval = role === "Admin" || role === "Evaluator";

  userMeta.textContent = `${session.username} • ${role}`;
  setLogoutVisible(true);

  // Role-based access
  const canAdd = isAdmin;
  const canViewCompetitors = isEval;
  const canEvaluate = isEval;

  setScreen(`
    <div class="hub-header">
      <h1 class="hub-title">اللوحة الرئيسية</h1>
      <p class="hub-sub">اختر الإجراء المطلوب</p>
      <div class="hint-bar"></div>
    </div>

    <div class="hub-grid" aria-label="لوحة التحكم">
      <button class="hub-tile pos-1" ${canAdd ? "" : "disabled"} id="btnAdd">
        <div class="hub-icon">${svgIcon("add_user")}</div>
        <div class="hub-label">إضافة متسابق</div>
      </button>

      <button class="hub-tile pos-2" ${canViewCompetitors ? "" : "disabled"} id="btnView">
        <div class="hub-icon">${svgIcon("users")}</div>
        <div class="hub-label">عرض المتسابقين</div>
      </button>

      <button class="hub-tile pos-3" ${canEvaluate ? "" : "disabled"} id="btnEval">
        <div class="hub-icon">${svgIcon("check_clipboard")}</div>
        <div class="hub-label">التقييم</div>
      </button>

      <button class="hub-tile pos-4" id="btnResults">
        <div class="hub-icon">${svgIcon("trophy")}</div>
        <div class="hub-label">النتائج</div>
      </button>

      <button class="hub-tile pos-5" id="btnLive">
        <div class="hub-icon">${svgIcon("chart")}</div>
        <div class="hub-label">البيانات الحية</div>
      </button>
    </div>
  `);

  // Navigation placeholders (we'll wire to real screens next)
  const noop = (name) => alert(`سنقوم ببناء شاشة: ${name} في الخطوة القادمة.`);

  document.getElementById("btnAdd")?.addEventListener("click", () => noop("إضافة متسابق"));
  document.getElementById("btnView")?.addEventListener("click", () => noop("عرض المتسابقين"));
  document.getElementById("btnEval")?.addEventListener("click", () => noop("التقييم"));
  document.getElementById("btnResults")?.addEventListener("click", () => noop("النتائج"));
  document.getElementById("btnLive")?.addEventListener("click", () => noop("البيانات الحية"));
}

/* ===== Logout (top icon) ===== */
topLogout?.addEventListener("click", async () => {
  await sb.auth.signOut();
  session = null;
  renderLogin();
});

/* ===== Init ===== */
async function initAuthFlow() {
  renderLoading("تهيئة النظام...");

  const { data } = await sb.auth.getSession();
  const sbSession = data?.session;

  if (!sbSession?.user) {
    session = null;
    return renderLogin();
  }

  const user = sbSession.user;
  const profile = await loadProfileRole(user);
  session = { user, role: profile.role, username: profile.username };

  renderMainDashboard();

  sb.auth.onAuthStateChange(async (_event, newSession) => {
    const user2 = newSession?.user;
    if (!user2) {
      session = null;
      return renderLogin();
    }
    const profile2 = await loadProfileRole(user2);
    session = { user: user2, role: profile2.role, username: profile2.username };
    renderMainDashboard();
  });
}

initAuthFlow();
