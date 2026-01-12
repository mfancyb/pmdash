/**
 * PM Dashboard – Full Integrated Loader (Squarespace 7.1 Safe)
 * Version: v1.0.0
 *
 * Usage:
 *   <div data-pmdash></div>
 *   <script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/pmdash@v1.0.0/pmdash.js" defer></script>
 */

(function () {
  if (window.__PMDASH_LOADER__) return;
  window.__PMDASH_LOADER__ = true;

  /* =========================
     CONFIG
     ========================= */
  const SUPABASE_URL = "https://iihhhnyzqqlovczfkkks.supabase.co";
  const SUPABASE_ANON_KEY = "iihhhnyzqqlovczfkkks";

  const DEFAULT_THEME = {
    accent: "#c4c4c4",
    accent2: "#c4c4c4",
    accent3: "#c4c4c4",
    accent4: "#c4c4c4",
  };

  const BLANK_PROJECT = (position) => ({
    position,
    title: "",
    client: "",
    month_year: "",
    description: "",
    goals: ["", "", ""],
    milestones: ["", "", ""],
    theme: { ...DEFAULT_THEME },
    archived_at: null,
  });

  /* =========================
     UTILITIES
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

  function ensureArray3(v) {
    const arr = Array.isArray(v) ? v.slice(0, 3) : [];
    while (arr.length < 3) arr.push("");
    return arr;
  }

  /* =========================
     CSS (scoped)
     ========================= */
  function injectCSS() {
    once("pmdash-css", () => {
      const s = document.createElement("style");
      s.id = "pmdash-css";
      s.textContent = `
      .pmdash{max-width:1200px;margin:0 auto}
      .pmdash .app{display:grid;grid-template-columns:78px 1fr;gap:16px;position:relative}
      .pmdash .tabs{display:flex;flex-direction:column;gap:12px;width:78px}
      .pmdash .tab{height:140px;border-radius:12px;background:#2a063f;color:#fff;
        display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:800}
      .pmdash .tab.active{outline:2px solid #fff}
      .pmdash .panel{background:#fff;border-radius:18px;padding:18px}
      .pmdash h1{margin:0 0 8px;font-size:32px}
      .pmdash textarea,.pmdash input[type="text"]{width:100%;margin-bottom:12px}
      .pmdash .cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .pmdash .task{display:flex;gap:8px;margin-bottom:8px}
      .pmdash button{cursor:pointer}
      `;
      document.head.appendChild(s);
    });
  }

  /* =========================
     HTML TEMPLATE
     ========================= */
  function htmlTemplate() {
    return `
      <div class="pmdash">
        <div class="app">
          <aside class="tabs"></aside>
          <section class="panel">
            <h1 contenteditable id="title">Project Title</h1>
            <input type="text" id="client" placeholder="Client" />
            <input type="text" id="monthYear" placeholder="Month, Year" />
            <textarea id="description" placeholder="Description"></textarea>

            <div class="cols">
              <div>
                <strong>Goals</strong>
                <div id="goals"></div>
              </div>
              <div>
                <strong>Milestones</strong>
                <div id="milestones"></div>
              </div>
            </div>

            <h3>Tasks</h3>
            <div id="tasks"></div>
            <button id="addTask">+ Add task</button>

            <hr/>
            <button id="save">Save</button>
            <button id="archive">Archive</button>
            <button id="delete">Delete</button>
          </section>
        </div>
      </div>
    `;
  }

  /* =========================
     DASHBOARD LOGIC
     ========================= */
  async function initDashboard(container) {
    if (container.__pmdashInit) return;
    container.__pmdashInit = true;

    const sb =
      window.__PMDASH_SB__ ||
      (window.__PMDASH_SB__ = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      ));

    let projects = [];
    let tasksByProject = new Map();
    let activeId = null;

    const elTabs = container.querySelector(".tabs");
    const elTitle = container.querySelector("#title");
    const elClient = container.querySelector("#client");
    const elMonthYear = container.querySelector("#monthYear");
    const elDesc = container.querySelector("#description");
    const elGoals = container.querySelector("#goals");
    const elMiles = container.querySelector("#milestones");
    const elTasks = container.querySelector("#tasks");

    async function loadAll() {
      const { data } = await sb.from("projects").select("*").order("position");
      projects = data || [];

      if (projects.length < 4) {
        const inserts = [];
        for (let i = projects.length + 1; i <= 4; i++) inserts.push(BLANK_PROJECT(i));
        await sb.from("projects").insert(inserts);
        return loadAll();
      }

      const ids = projects.map(p => p.id);
      const t = await sb.from("tasks").select("*").in("project_id", ids);

      tasksByProject.clear();
      projects.forEach(p => tasksByProject.set(p.id, []));
      (t.data || []).forEach(task => {
        tasksByProject.get(task.project_id).push(task);
      });

      activeId = projects[0].id;
      renderTabs();
      renderEditor();
    }

    function renderTabs() {
      elTabs.innerHTML = "";
      projects.forEach(p => {
        const d = document.createElement("div");
        d.className = "tab" + (p.id === activeId ? " active" : "");
        d.textContent = p.title || `Project ${p.position}`;
        d.onclick = () => {
          activeId = p.id;
          renderTabs();
          renderEditor();
        };
        elTabs.appendChild(d);
      });
    }

    function renderEditor() {
      const p = projects.find(x => x.id === activeId);
      if (!p) return;

      elTitle.textContent = p.title || "Project Title";
      elClient.value = p.client || "";
      elMonthYear.value = p.month_year || "";
      elDesc.value = p.description || "";

      elGoals.innerHTML = "";
      ensureArray3(p.goals).forEach((g, i) => {
        const inp = document.createElement("input");
        inp.value = g;
        inp.oninput = () => { p.goals[i] = inp.value; autosave(); };
        elGoals.appendChild(inp);
      });

      elMiles.innerHTML = "";
      ensureArray3(p.milestones).forEach((m, i) => {
        const inp = document.createElement("input");
        inp.value = m;
        inp.oninput = () => { p.milestones[i] = inp.value; autosave(); };
        elMiles.appendChild(inp);
      });

      renderTasks();
    }

    function renderTasks() {
      elTasks.innerHTML = "";
      (tasksByProject.get(activeId) || []).forEach(t => {
        const row = document.createElement("div");
        row.className = "task";
        const inp = document.createElement("input");
        inp.value = t.title;
        inp.oninput = () => t.title = inp.value;
        row.appendChild(inp);
        elTasks.appendChild(row);
      });
    }

    let saveTimer;
    function autosave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 600);
    }

    async function save() {
      const p = projects.find(x => x.id === activeId);
      if (!p) return;

      p.title = elTitle.textContent.trim();
      p.client = elClient.value;
      p.month_year = elMonthYear.value;
      p.description = elDesc.value;
      p.goals = ensureArray3(p.goals);
      p.milestones = ensureArray3(p.milestones);

      await sb.from("projects").upsert(p);

      const tasks = tasksByProject.get(activeId) || [];
      for (const t of tasks) {
        await sb.from("tasks").upsert(t);
      }
    }

    container.querySelector("#addTask").onclick = () => {
      const list = tasksByProject.get(activeId);
      list.push({ id: crypto.randomUUID(), project_id: activeId, title: "" });
      renderTasks();
    };

    container.querySelector("#save").onclick = save;
    container.querySelector("#archive").onclick = async () => {
      const p = projects.find(x => x.id === activeId);
      p.archived_at = new Date().toISOString();
      await save();
      loadAll();
    };
    container.querySelector("#delete").onclick = async () => {
      await sb.from("projects").delete().eq("id", activeId);
      loadAll();
    };

    await loadAll();
  }

  /* =========================
     MOUNT (AJAX SAFE)
     ========================= */
  async function mount() {
    injectCSS();
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");

    document.querySelectorAll("[data-pmdash]").forEach(el => {
      if (el.__pmdashMounted) return;
      el.__pmdashMounted = true;
      el.innerHTML = htmlTemplate();
      initDashboard(el);
    });
  }

  document.addEventListener("DOMContentLoaded", mount);
  document.addEventListener("page:load", mount);
})();

