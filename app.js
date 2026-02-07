const root = document.getElementById("screenRoot");
const userMeta = document.getElementById("userMeta");
const logoutBtn = document.getElementById("logoutBtn");

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
function setHeroBackground(on) {
  document.body.classList.toggle("hero-bg", Boolean(on));
}
function toEmail(input) {
  const v = (input || "").trim().toLowerCase();
  if (!v) return "";
  if (v.includes("@")) return v;
  return `${v}@${USERNAME_EMAIL_DOMAIN}`;
}
function setLogoutVisible(v) {
  logoutBtn.style.display = v ? "flex" : "none";
}

async function loadProfileRole(user) {
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

/* ===== Icons (minimal outline) ===== */
function iconSvg(name) {
  const s = `fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
  switch (name) {
    case "add":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${s} d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <path ${s} d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
        <path ${s} d="M20 8v6"/><path ${s} d="M17 11h6"/>
      </svg>`;
    case "list":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${s} d="M8 6h13"/><path ${s} d="M8 12h13"/><path ${s} d="M8 18h13"/>
        <path ${s} d="M3 6h.01"/><path ${s} d="M3 12h.01"/><path ${s} d="M3 18h.01"/>
      </svg>`;
    case "eval":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${s} d="M9 5h6"/><path ${s} d="M9 3h6a2 2 0 0 1 2 2v2H7V5a2 2 0 0 1 2-2z"/>
        <path ${s} d="M7 7h10v14H7z"/><path ${s} d="M9 14l2 2 4-5"/>
      </svg>`;
    case "results":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${s} d="M8 4h8v3a4 4 0 0 1-8 0V4z"/>
        <path ${s} d="M6 4H4v3a4 4 0 0 0 4 4"/>
        <path ${s} d="M18 4h2v3a4 4 0 0 1-4 4"/>
        <path ${s} d="M12 11v4"/><path ${s} d="M9 21h6"/><path ${s} d="M10 15h4v6h-4z"/>
      </svg>`;
    case "live":
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path ${s} d="M4 19V5"/><path ${s} d="M4 19h16"/>
        <path ${s} d="M8 17v-6"/><path ${s} d="M12 17v-10"/><path ${s} d="M16 17v-3"/>
      </svg>`;
    default:
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${s} d="M4 12h16"/></svg>`;
  }
}

/* ===== Screens ===== */
function renderLogin(note = "") {
  setHeroBackground(true);
  userMeta.textContent = "";
  setLogoutVisible(false);

  setScreen(`
    <div class="login-wrap">
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

      ${note ? `<div class="notice">${note}</div>` : ""}
    </div>
  `);

  const uEl = document.getElementById("u");
  const pEl = document.getElementById("p");
  const btn = document.getElementById("loginBtn");

  // MUST be empty by default
  pEl.value = "";

  const onEnter = (e) => e.key === "Enter" && btn.click();
  uEl.addEventListener("keydown", onEnter);
  pEl.addEventListener("keydown", onEnter);

  btn.onclick = async () => {
    const email = toEmail(uEl.value);
    const password = (pEl.value || "").trim();
    if (!password) return renderLogin("الرجاء إدخال كلمة المرور.");

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return renderLogin("بيانات الدخول غير صحيحة.");

    const profile = await loadProfileRole(data.user);
    session = { user: data.user, role: profile.role, username: profile.username };
    renderMainDashboard();
  };
}

function renderMainDashboard() {
  setHeroBackground(false);
  if (!session?.user) return renderLogin();

  const role = session.role;
  const isAdmin = role === "Admin";
  const isEval = role === "Admin" || role === "Evaluator";

  userMeta.textContent = `${session.username} • ${role}`;
  setLogoutVisible(true);

  // Permissions
  const canAdd = isAdmin;
  const canView = isEval;
  const canEval = isEval;

  setScreen(`
    <div class="hub-head">
      <h2 class="hub-title">اللوحة الرئيسية</h2>
      <p class="hub-sub">اختر الإجراء المطلوب</p>
      <div class="hint-bar"></div>
    </div>

    <div class="hub-grid">
      <button class="hub-tile pos-1" ${canAdd ? "" : "disabled"} id="btnAdd">
        <div class="hub-icon">${iconSvg("add")}</div>
        <div class="hub-label">إضافة متسابق</div>
      </button>

      <button class="hub-tile pos-2" ${canView ? "" : "disabled"} id="btnView">
        <div class="hub-icon">${iconSvg("list")}</div>
        <div class="hub-label">عرض المتسابقين</div>
      </button>

      <button class="hub-tile pos-3" ${canEval ? "" : "disabled"} id="btnEval">
        <div class="hub-icon">${iconSvg("eval")}</div>
        <div class="hub-label">التقييم</div>
      </button>

      <button class="hub-tile pos-4" id="btnResults">
        <div class="hub-icon">${iconSvg("results")}</div>
        <div class="hub-label">النتائج</div>
      </button>

      <button class="hub-tile pos-5" id="btnLive">
        <div class="hub-icon">${iconSvg("live")}</div>
        <div class="hub-label">البيانات الحية</div>
      </button>
    </div>
  `);

  const noop = (name) => alert(`سنقوم ببناء شاشة: ${name} في الخطوة القادمة.`);

  document.getElementById("btnAdd")?.addEventListener("click", () => noop("إضافة متسابق"));
  document.getElementById("btnView")?.addEventListener("click", () => noop("عرض المتسابقين"));
  document.getElementById("btnEval")?.addEventListener("click", () => noop("التقييم"));
  document.getElementById("btnResults")?.addEventListener("click", () => noop("النتائج"));
  document.getElementById("btnLive")?.addEventListener("click", () => noop("البيانات الحية"));
}

/* Logout */
logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
  session = null;
  renderLogin();
});

/* Init */
async function init() {
  const { data } = await sb.auth.getSession();
  if (!data?.session?.user) return renderLogin();

  const profile = await loadProfileRole(data.session.user);
  session = { user: data.session.user, role: profile.role, username: profile.username };
  renderMainDashboard();
}

init();
