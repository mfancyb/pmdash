(function () {
  // Hard guard
  try {
    const SUPABASE_URL = "https://iihhhnyzqqlovczfkkks.supabase.co";
    const SUPABASE_ANON_KEY = "iihhhnyzqqlovczfkkks";

    // Debounce mounts
    let mountTimer = null;

    function loadScriptOnce(src) {
      return new Promise((resolve) => {
        if ([...document.scripts].some(s => (s.src || "").includes(src))) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.defer = true;
        s.onload = resolve;
        document.head.appendChild(s);
      });
    }

    function injectCSSOnce() {
      if (document.getElementById("pmdash-css")) return;
      const style = document.createElement("style");
      style.id = "pmdash-css";
      style.textContent = `
        .pmdash-wrap{max-width:1200px;margin:0 auto;padding:16px;border-radius:16px;background:rgba(255,255,255,.92)}
        .pmdash-wrap h2{margin:0 0 8px;font-size:22px}
        .pmdash-wrap .pmdash-note{font-size:13px;opacity:.7}
      `;
      document.head.appendChild(style);
    }

    async function mount() {
      // Only run if the placeholder exists
      const targets = document.querySelectorAll("[data-pmdash]");
      if (!targets.length) return;

      injectCSSOnce();
      await loadScriptOnce("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");

      targets.forEach((el) => {
        if (el.__pmdashMounted) return;
        el.__pmdashMounted = true;

        el.innerHTML = `
          <div class="pmdash-wrap">
            <h2>PM Dashboard</h2>
            <div class="pmdash-note">Loader active. Supabase library loaded.</div>
          </div>
        `;

        // client
        if (!window.__PMDASH_SB__ && window.supabase) {
          window.__PMDASH_SB__ = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
      });
    }

    function scheduleMount() {
      clearTimeout(mountTimer);
      mountTimer = setTimeout(mount, 60);
    }

    document.addEventListener("DOMContentLoaded", scheduleMount);
    document.addEventListener("page:load", scheduleMount);
  } catch (e) {
    // Never let errors break Squarespace rendering
    console.error("[PMDASH] loader error:", e);
  }
})();

