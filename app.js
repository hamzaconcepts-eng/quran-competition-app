function renderMainDashboard() {
  setHeroBackground(false);
  if (!session?.user) return renderLogin();

  const role = session.role;
  const isAdmin = role === "Admin";
  const isEval = role === "Admin" || role === "Evaluator";

  userMeta.textContent = `${session.username} • ${role}`;

  setScreen(`
    <div class="dashboard">

      <!-- Header -->
      <header class="dashboard-header">
        <h1 class="dashboard-title">اللوحة الرئيسية</h1>
        <p class="dashboard-subtitle">
          نظام تقييم مسابقة حفظ القرآن الكريم
        </p>
      </header>

      <!-- Primary Actions -->
      <section class="dashboard-section">
        <h3 class="section-label">الإجراءات الأساسية</h3>

        <div class="card-grid">

          <button class="card primary" ${isEval ? "" : "disabled"} id="btnEvaluate">
            <div class="card-title">التقييم</div>
            <div class="card-subtitle">إدخال الدرجات مباشرة</div>
          </button>

          <button class="card primary" ${isEval ? "" : "disabled"} id="btnCompetitors">
            <div class="card-title">المتسابقون</div>
            <div class="card-subtitle">بحث · فرز · عرض النتائج</div>
          </button>

        </div>
      </section>

      <!-- Management -->
      <section class="dashboard-section">
        <h3 class="section-label">الإدارة</h3>

        <div class="card-grid">

          <button class="card" ${isAdmin ? "" : "disabled"} id="btnRegister">
            <div class="card-title">تسجيل متسابق جديد</div>
            <div class="card-subtitle">إضافة فردية أو CSV</div>
          </button>

        </div>
      </section>

      <!-- Viewing -->
      <section class="dashboard-section">
        <h3 class="section-label">العرض والمتابعة</h3>

        <div class="card-grid">

          <button class="card" id="btnResults">
            <div class="card-title">النتائج</div>
            <div class="card-subtitle">الترتيب والطباعة</div>
          </button>

          <button class="card" id="btnLive">
            <div class="card-title">لوحة المتابعة المباشرة</div>
            <div class="card-subtitle">عرض حي للجمهور</div>
          </button>

        </div>
      </section>

      <!-- Footer Action -->
      <div class="dashboard-footer">
        <button class="logout-btn" id="btnLogout">تسجيل الخروج</button>
      </div>

    </div>
  `);

  // Wiring (placeholders for now)
  const noop = () => alert("سيتم بناء هذه الشاشة لاحقًا.");

  document.getElementById("btnEvaluate")?.addEventListener("click", noop);
  document.getElementById("btnCompetitors")?.addEventListener("click", noop);
  document.getElementById("btnRegister")?.addEventListener("click", noop);
  document.getElementById("btnResults")?.addEventListener("click", noop);
  document.getElementById("btnLive")?.addEventListener("click", noop);

  document.getElementById("btnLogout")?.addEventListener("click", async () => {
    await sb.auth.signOut();
    session = null;
    renderLogin();
  });
}
