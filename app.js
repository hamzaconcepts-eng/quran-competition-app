const root = document.getElementById("screenRoot");
const userMeta = document.getElementById("userMeta");

const USERNAME_EMAIL_DOMAIN = "riyad.local";

/* ===== Supabase Config ===== */
const SUPABASE_URL = "https://uqpumxbiqnccgqkiwzur.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcHVteGJpcW5jY2dxa2l3enVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjkxNDUsImV4cCI6MjA4NjA0NTE0NX0._HK-1dKy7897hQPlrZWAOiwPUB5q8u3X9HPiIQN3WQo";

/* global supabase */
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let session = null;

/* ===== Connection Indicator ===== */
function mountConnectionIndicator() {
  if (document.getElementById("conn-indicator")) return;

  const dot = document.createElement("div");
  dot.id = "conn-indicator";
  dot.style.position = "fixed";
  dot.style.bottom = "14px";
  dot.style.left = "14px";
  dot.style.width = "12px";
  dot.style.height = "12px";
  dot.style.borderRadius = "50%";
  dot.style.background = "#b42318"; // red by default
  dot.style.boxShadow = "0 0 0 4px rgba(180,35,24,0.25)";
  dot.style.zIndex = "9999";
  document.body.appendChild(dot);
}

function setConnectionStatus(isConnected) {
  const dot = document.getElementById("conn-indicator");
  if (!dot) return;

  if (isConnected) {
    dot.style.background = "#1a7f37"; // green
    dot.style.boxShadow = "0 0 0 4px rgba(26,127,55,0.25)";
  } else {
    dot.style.background = "#b42318"; // red
    dot.style.boxShadow = "0 0 0 4px rgba(180,35,24,0.25)";
  }
}

async function checkSupabaseConnection() {
  try {
    const { error } = await sb.auth.getSession();
    setConnectionStatus(!error);
  } catch {
    setConnectionStatus(false);
  }
}

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

  pEl.value = ""; // ensure empty

  const onEnter = (e) => e.key === "Enter" && btn.click();
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
        <h3>الإدارة والتسجيل</h3>
        <button ${isAdmin ? "" : "disabled"}>تسجيل متسابق جديد</button>
      </div>

      <div class="section">
        <h3>التقييم والمتسابقون</h3>
        <button ${isEval ? "" : "disabled"}>المتسابقون</button>
        <button ${isEval ? "" : "disabled"}>التقييم</button>
      </div>

      <div class="section">
        <h3>العرض</h3>
        <button>النتائج</button>
        <button>لوحة المتابعة المباشرة</button>
      </div>

      <div class="actions">
        <button id="btnLogout">تسجيل الخروج</button>
      </div>
    </div>
  `);

  document.getElementById("btnLogout").onclick = async () => {
    await sb.auth.signOut();
    session = null;
    renderLogin();
  };
}

/* ===== Init ===== */
async function init() {
  mountConnectionIndicator();
  await checkSupabaseConnection();

  const { data } = await sb.auth.getSession();
  if (!data.session) {
    renderLogin();
  } else {
    const user = data.session.user;
    const profile = await loadProfileRole(user);
    session = { user, role: profile.role, username: profile.username };
    renderMainDashboard();
  }
}

init();
