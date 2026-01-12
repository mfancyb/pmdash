/**
 * PM Dashboard – Squarespace 7.1 Safe Embed
 * Host this file publicly (GitHub + jsDelivr recommended)
 *
 * Usage in Squarespace:
 *   <div data-pmdash></div>
 *   <script src="https://cdn.jsdelivr.net/gh/USERNAME/pmdash@v1.0.0/pmdash.js" defer></script>
 */

(function () {
  /* =========================
     Global guards
     ========================= */
  if (window.__PMDASH_LOADER__) return;
  window.__PMDASH_LOADER__ = true;

  const SUPABASE_URL = "https://iihhhnyzqqlovczfkkks.supabase.co";
  const SUPABASE_ANON_KEY = "iihhhnyzqqlovczfkkks";

  /* =========================
     Utilities
     ========================= */
  function once(id, fn) {
    if (document.getElementById(id)) return;
    fn();
  }

  function loadScript(src) {
    return new Promise((resolve) => {
      if ([...document.scripts].some(s => s.src.includes(src))) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  /* =========================
     CSS injection (scoped)
     ========================= */
  function injectCSS() {
    once("pmdash-css", () => {
      const style = document.createElement("style");
      style.id = "pmdash-css";
      style.textContent = `
        .pmdash { max-width:1200px;margin:0 auto; }
        .pmdash .app{display:grid;grid-template-columns:78px 1fr;gap:16px;position:relative}
        .pmdash .tabs{width:78px;display:flex;flex-direction:column;gap:12px}
        .pmdash .tab{height:140px;border-radius:12px;background:#2a063f;color:#fff;
          display:flex;align-items:center;justify-content:center;cursor:pointer}
        .pmdash .panel{background:#fff;border-radius:18px;padding:18px}
        .pmdash h1{margin:0 0 12px 0;font-size:32px}
        .pmdash textarea{width:100%;min-height:120px}
      `;
      document.head.appendChild(style);
    });
  }

  /* =========================
     HTML injection
     ========================= */
  function injectHTML(container) {
    container.innerHTML = `
      <div class="pmdash">
        <div class="app">
          <aside class="tabs" id="pmdash-tabs"></aside>
          <section class="panel">
            <h1 contenteditable id="pmdash-title">Project</h1>
            <textarea id="pmdash-desc" placeholder="Project description…"></textarea>
            <p style="margin-top:12px;font-size:13px;opacity:.6">
              Connected to Supabase
            </p>
          </section>
        </div>
      </div>
    `;
  }

  /* =========================
     App init (minimal stub)
     ========================= */
  function initApp(container) {
    if (container.__pmdashInit) return;
    container.__pmdashInit = true;

    const title = container.querySelector("#pmdash-title");
    const desc = container.querySelector("#pmdash-desc");
    const tabs = container.querySelector("#pmdash-tabs");

    tabs.innerHTML = `<div class="tab">Project 1</div>`;

    title.addEventListener("input", () => {
      console.log("Title changed:", title.textContent);
    });

    desc.addEventListener("input", () => {
      console.log("Description changed:", desc.value);
    });
  }

  /* =========================
     Mount logic (AJAX-safe)
     ========================= */
  async function mount() {
    const containers = document.querySelectorAll("[data-pmdash]");
    if (!containers.length) return;

    injectCSS();
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");

    containers.forEach((container) => {
      if (container.__pmdashMounted) return;
      container.__pmdashMounted = true;

      injectHTML(container);
      initApp(container);

      // Supabase client (one per page)
      if (!window.__PMDASH_SB__) {
        window.__PMDASH_SB__ = window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );
        console.log("PM Dashboard Supabase connected");
      }
    });
  }

  /* =========================
     Run on load + SPA nav
     ========================= */
  document.addEventListener("DOMContentLoaded", mount);
  document.addEventListener("page:load", mount);
})();
