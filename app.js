const root = document.getElementById("screenRoot");
const userMeta = document.getElementById("userMeta");

const USERNAME_EMAIL_DOMAIN = "riyad.local";

/* ===== Supabase Config ===== */
const SUPABASE_URL = "https://uqpumxbiqnccgqkiwzur.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcHVteGJpcW5jY2dxa2l3enVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjkxNDUsImV4cCI6MjA4NjA0NTE0NX0._HK-1dKy7897hQPlrZWAOiwPUB5q8u3X9HPiIQN3WQo";

/* global supabase */
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

let session = null;

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
    role: data?.role || "Viewer",
    username: data?.username || user.email.split("@")[0],
  };
}

/* ===== Screens ===== */
function renderLoading(title = "جاري الدخول...") {
  setHeroBackground(true);
  userMeta.textContent = "";
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
        <input id="p" type="password" placeholder="••••••••" autocomplete="current-password" />
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

  const onEnter = (e) => {
    if (e.key === "Enter") btn.click();
  };
  uEl.addEventListener("keydown", onEnter);
  pEl.addEventListener("keydown", onEnter);

  btn.onclick = async () => {
    const email = toEmail(uEl.value);
    const password = (pEl.value || "").trim();

    if (!email || !password) {
      return renderLogin("الرجاء إدخال كلمة المرور.");
    }

    renderLoading();

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      return renderLogin("بيانات الدخول غير صحيحة.");
    }

    const user = data.user;
    const profile = await loadProfileRole(user);
    session = { user, role: profile.role, username: profile.username };

    renderMainDashboard();
  };
}

function renderMainDashboard() {
  setHeroBackground(true);
  if (!session?.user) return renderLogin();

  const role = session.role;
  const isAdmin = role === "Admin";
  const isEval = role === "Admin" || role === "Evaluator";

  userMeta.textContent = `${session.username} • ${role}`;

  const noop = () => alert("هذه الشاشة سنبنيها لاحقًا.");

  setScreen(`
    <div class="dashboard-head">
      <div>
        <h1 class="h1">اللوحة الرئيسية</h1>
        <p class="p">واجهة التحكم والتنقل بين الشاشات.</p>
      </div>
    </div>

    <div class="hint-bar"></div>

    <div class="sections">

      <div class="section">
        <div class="section-title">
          <h3>الإدارة والتسجيل</h3>
          <span>Admin فقط</span>
        </div>
        <div class="action-grid">
          <button class="action-card" ${isAdmin ? "" : "disabled"} id="btnRegister">
            <div class="action-text">
              <div class="title">تسجيل متسابق جديد</div>
              <div class="sub">إضافة يدويًا أو عبر CSV</div>
            </div>
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <h3>التقييم والمتسابقون</h3>
          <span>Admin / Evaluator</span>
        </div>
        <div class="action-grid">
          <button class="action-card" ${isEval ? "" : "disabled"} id="btnCompetitors">
            <div class="action-text">
              <div class="title">المتسابقون</div>
            </div>
          </button>
          <button class="action-card" ${isEval ? "" : "disabled"} id="btnEvaluate">
            <div class="action-text">
              <div class="title">التقييم</div>
            </div>
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <h3>العرض</h3>
          <span>الجميع</span>
        </div>
        <div class="action-grid">
          <button class="action-card" id="btnResults">
            <div class="action-text">
              <div class="title">النتائج</div>
            </div>
          </button>
          <button class="action-card" id="btnLive">
            <div class="action-text">
              <div class="title">لوحة المتابعة المباشرة</div>
            </div>
          </button>
        </div>
      </div>

      <div class="actions">
        <button class="accent" id="btnLogout">تسجيل الخروج</button>
      </div>

    </div>
  `);

  document.getElementById("btnRegister")?.addEventListener("click", noop);
  document.getElementById("btnCompetitors")?.addEventListener("click", noop);
  document.getElementById("btnEvaluate")?.addEventListener("click", noop);
  document.getElementById("btnResults")?.addEventListener("click", noop);
  document.getElementById("btnLive")?.addEventListener("click", noop);

  document.getElementById("btnLogout")?.addEventListener("click", async () => {
    await sb.auth.signOut();
    session = null;
    renderLogin();
  });
}

/* ===== Init ===== */
async function initAuthFlow() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    return renderLogin();
  }

  const user = data.session.user;
  const profile = await loadProfileRole(user);
  session = { user, role: profile.role, username: profile.username };

  renderMainDashboard();
}

initAuthFlow();
