const root = document.getElementById("screenRoot");
const userMeta = document.getElementById("userMeta");

/**
 * Supabase Auth uses EMAIL + password.
 * We simulate "username" by converting it into an email:
 *   username@riyad.local
 */
const USERNAME_EMAIL_DOMAIN = "riyad.local";

/* ===== Supabase Config ===== */
const SUPABASE_URL = "https://puabskrqylxrzcczvnxk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1YWJza3JxeWx4cnpjY3p2bnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NTUxODEsImV4cCI6MjA4NjAzMTE4MX0.3ldFNJ4enLiPR7fuigX5C3o1BzIqQSSSe986MjvZFVc";

/* global supabase */
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

let session = null; // { user, role, username }

/* ===== Helpers ===== */
function setScreen(html) {
  root.innerHTML = html;
}
function setHeroBackground(isOn) {
  document.body.classList.toggle("hero-bg", Boolean(isOn));
}
function showError(msg) {
  alert(msg);
}
function usernameToEmail(username) {
  return `${username}@${USERNAME_EMAIL_DOMAIN}`;
}
async function loadProfileRole(user) {
  if (!user) return { role: "Viewer", username: "" };

  const { data, error } = await sb
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { role: "Viewer", username: user.email?.split("@")[0] || "" };

  const role = (data?.role || "Viewer").trim();
  const username = (data?.username || user.email?.split("@")[0] || "").trim();
  return { role, username };
}

/* ===== Screens ===== */
function renderLoading(title = "جاري التحميل...") {
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

function renderLogin() {
  setHeroBackground(true);
  userMeta.textContent = "";

  setScreen(`
    <div>
      <h1 class="h1">تسجيل الدخول</h1>
      <p class="p">الدخول مخصص للمصرّح لهم فقط.</p>
      <div class="hint-bar"></div>

      <div class="field">
        <label>اسم المستخدم</label>
        <input id="u" placeholder="مثال: admin" autocomplete="username" />
      </div>

      <div class="field">
        <label>كلمة المرور</label>
        <input id="p" type="password" placeholder="••••••••" autocomplete="current-password" />
      </div>

      <div class="actions">
        <button class="primary" id="loginBtn">دخول</button>
      </div>

      <div class="notice">
        يتم تسجيل الدخول عبر Supabase.
      </div>
    </div>
  `);

  document.getElementById("loginBtn").onclick = async () => {
    const username = document.getElementById("u").value.trim().toLowerCase();
    const password = document.getElementById("p").value.trim();

    if (!username || !password) return showError("الرجاء إدخال اسم المستخدم وكلمة المرور.");

    renderLoading("تسجيل الدخول...");

    const email = usernameToEmail(username);
    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      renderLogin();
      return showError("بيانات الدخول غير صحيحة.");
    }

    const user = data?.user;
    const profile = await loadProfileRole(user);
    session = { user, role: profile.role, username: profile.username || username };

    renderMainDashboard();
  };
}

function renderMainDashboard() {
  setHeroBackground(true);
  if (!session?.user) return renderLogin();

  const role = session.role; // Admin | Evaluator | Viewer
  const isAdmin = role === "Admin";
  const isEval = role === "Admin" || role === "Evaluator";
  const isViewer = role === "Viewer";

  userMeta.textContent = `${session.username} • ${role}`;

  const roleDotColor =
    role === "Admin" ? "style='background: rgba(255,134,4,.95); box-shadow:0 0 0 4px rgba(255,134,4,.18)'" :
    role === "Evaluator" ? "style='background: rgba(117,191,192,.95); box-shadow:0 0 0 4px rgba(117,191,192,.18)'" :
    "style='background: rgba(253,214,97,.95); box-shadow:0 0 0 4px rgba(253,214,97,.18)'";

  const noop = () => alert("هذه الشاشة سنبنيها كخطوة قادمة بشكل نهائي.");

  setScreen(`
    <div class="dashboard-head">
      <div>
        <h1 class="h1">اللوحة الرئيسية</h1>
        <p class="p">واجهة التحكم والتنقل بين الشاشات.</p>
      </div>

      <div class="role-pill">
        <span class="role-dot" ${roleDotColor}></span>
        <span>${role === "Admin" ? "مدير النظام" : role === "Evaluator" ? "مُقيّم" : "مشاهد"}</span>
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
            <div class="action-left">
              <div class="icon-pill icon-sun">＋</div>
              <div class="action-text">
                <div class="title">تسجيل متسابق جديد</div>
                <div class="sub">إضافة يدويًا أو عبر CSV</div>
              </div>
            </div>
            <div class="chev">‹</div>
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
            <div class="action-left">
              <div class="icon-pill icon-teal">≡</div>
              <div class="action-text">
                <div class="title">المتسابقون</div>
                <div class="sub">بحث • فرز • فلترة • طباعة</div>
              </div>
            </div>
            <div class="chev">‹</div>
          </button>

          <button class="action-card" ${isEval ? "" : "disabled"} id="btnEvaluate">
            <div class="action-left">
              <div class="icon-pill icon-warm">★</div>
              <div class="action-text">
                <div class="title">التقييم</div>
                <div class="sub">درجة مباشرة + أخطاء</div>
              </div>
            </div>
            <div class="chev">‹</div>
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <h3>العرض والمتابعة</h3>
          <span>الجميع</span>
        </div>

        <div class="action-grid">
          <button class="action-card" id="btnResults">
            <div class="action-left">
              <div class="icon-pill icon-dark">٪</div>
              <div class="action-text">
                <div class="title">النتائج</div>
                <div class="sub">الجدول + طباعة PDF</div>
              </div>
            </div>
            <div class="chev">‹</div>
          </button>

          <button class="action-card" id="btnLive">
            <div class="action-left">
              <div class="icon-pill icon-teal">●</div>
              <div class="action-text">
                <div class="title">لوحة المتابعة المباشرة</div>
                <div class="sub">عرض للجمهور/البروجكتر</div>
              </div>
            </div>
            <div class="chev">‹</div>
          </button>
        </div>
      </div>

      <div class="actions" style="margin-top:2px;">
        <button class="accent" id="btnLogout">تسجيل الخروج</button>
      </div>

      <div class="notice">
        ${isViewer ? "وضع المشاهد: يمكنك الوصول للنتائج ولوحة المتابعة فقط." : "تظهر لك الأزرار حسب الصلاحية."}
      </div>

    </div>
  `);

  // Wiring (placeholders now)
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

/* ===== Auth bootstrap ===== */
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
  session = { user, role: profile.role, username: profile.username || user.email?.split("@")[0] || "" };

  renderMainDashboard();

  sb.auth.onAuthStateChange(async (_event, newSession) => {
    const user2 = newSession?.user;
    if (!user2) {
      session = null;
      return renderLogin();
    }
    const profile2 = await loadProfileRole(user2);
    session = { user: user2, role: profile2.role, username: profile2.username || user2.email?.split("@")[0] || "" };
    renderMainDashboard();
  });
}

initAuthFlow();
