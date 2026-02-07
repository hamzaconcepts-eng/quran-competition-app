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

/* ===== FORCE connection indicator (ALWAYS visible) ===== */
function mountConnectionIndicator() {
  if (document.getElementById("conn-indicator")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="conn-indicator"
      style="
        position:fixed;
        bottom:16px;
        left:16px;
        width:14px;
        height:14px;
        border-radius:50%;
        background:#b42318;
        box-shadow:0 0 0 5px rgba(180,35,24,.25);
        z-index:2147483647;
        pointer-events:none;
      ">
    </div>
    `
  );
}

function setConnectionStatus(ok) {
  const dot = document.getElementById("conn-indicator");
  if (!dot) return;

  if (ok) {
    dot.style.background = "#1a7f37";
    dot.style.boxShadow = "0 0 0 5px rgba(26,127,55,.25)";
  } else {
    dot.style.background = "#b42318";
    dot.style.boxShadow = "0 0 0 5px rgba(180,35,24,.25)";
  }
}

async function checkConnection() {
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
function setHeroBackground(on) {
  document.body.classList.toggle("hero-bg", Boolean(on));
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
        <input id="p" type="password" autocomplete="new-password" />
      </div>

      <div class="actions">
        <button class="primary" id="loginBtn">دخول</button>
      </div>

      ${note ? `<div class="notice" style="color:#b42318;">${note}</div>` : ""}
    </div>
  `);

  const u = document.getElementById("u");
  const p = document.getElementById("p");
  const btn = document.getElementById("loginBtn");
  p.value = ""; // ALWAYS empty

  const onEnter = (e) => e.key === "Enter" && btn.click();
  u.addEventListener("keydown", onEnter);
  p.addEventListener("keydown", onEnter);

  btn.onclick = async () => {
    const email = toEmail(u.value);
    const password = p.value.trim();
    if (!password) return renderLogin("الرجاء إدخال كلمة المرور.");

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return renderLogin("بيانات الدخول غير صحيحة.");

    const profile = await loadProfileRole(data.user);
    session = { user: data.user, role: profile.role, username: profile.username };
    renderMainDashboard();
  };
}

function renderMainDashboard() {
  setHeroBackground(true);
  userMeta.textContent = `${session.username} • ${session.role}`;

  setScreen(`
    <h1 class="h1">اللوحة الرئيسية</h1>
    <p class="p">تم تسجيل الدخول بنجاح.</p>
    <button id="logout">تسجيل الخروج</button>
  `);

  document.getElementById("logout").onclick = async () => {
    await sb.auth.signOut();
    session = null;
    renderLogin();
  };
}

/* ===== Init ===== */
async function init() {
  mountConnectionIndicator();     // ← يظهر فورًا
  await checkConnection();        // ← يلوّن أخضر/أحمر

  const { data } = await sb.auth.getSession();
  if (!data.session) {
    renderLogin();
  } else {
    const profile = await loadProfileRole(data.session.user);
    session = {
      user: data.session.user,
      role: profile.role,
      username: profile.username,
    };
    renderMainDashboard();
  }
}

init();
