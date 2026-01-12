(function () {
  try {
    // ====== CONFIG ======
    const SUPABASE_URL = "https://iihhhnyzqqlovczfkkks.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_z0Dyw3JdaQqY9-5-M6ii6Q_fvbxSlon";

    // ====== helpers ======
    const ensure3 = (v) => {
      const a = Array.isArray(v) ? v.slice(0, 3) : [];
      while (a.length < 3) a.push("");
      return a;
    };

    const uid = () =>
      (crypto?.randomUUID?.() || ("u" + Math.random().toString(16).slice(2))).replace(/-/g, "");

    const loadSupabase = () =>
      new Promise((resolve) => {
        if (window.supabase) return resolve();
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload = resolve;
        document.head.appendChild(s);
      });

    // ====== CSS (scoped) ======
    function injectCSSOnce() {
      if (document.getElementById("pmdash-css")) return;
      const style = document.createElement("style");
      style.id = "pmdash-css";
      style.textContent = `
        .pmdash-wrap{max-width:1200px;margin:0 auto}
        .pmdash-app{display:grid;grid-template-columns:76px 1fr;gap:14px}
        .pmdash-tabs{display:flex;flex-direction:column;gap:10px}
        .pmdash-tab{height:135px;border-radius:12px;background:#2a063f;color:#fff;cursor:pointer;
          display:flex;align-items:center;justify-content:center;font-weight:800;text-align:center;
          padding:10px;line-height:1.1;user-select:none}
        .pmdash-tab.pmdash-active{outline:2px solid rgba(255,255,255,.85)}
        .pmdash-panel{background:rgba(255,255,255,.95);border-radius:16px;padding:16px;border:1px solid rgba(0,0,0,.08)}
        .pmdash-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
        .pmdash-row input[type="text"]{padding:10px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.18);min-width:220px}
        .pmdash-title{font-size:28px;font-weight:900;line-height:1.05;margin:0 0 8px}
        .pmdash-title[contenteditable="true"]{outline:none;border-radius:10px;padding:6px 8px}
        .pmdash-title[contenteditable="true"]:focus{box-shadow:0 0 0 2px rgba(42,6,63,.2)}
        .pmdash-textarea{width:100%;min-height:110px;padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,.18);margin:10px 0}
        .pmdash-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .pmdash-box{background:rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:12px}
        .pmdash-box h4{margin:0 0 8px;font-size:16px}
        .pmdash-box input[type="text"]{width:100%;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.18);margin-bottom:8px}
        .pmdash-hr{margin:14px 0;border:none;border-top:1px solid rgba(0,0,0,.1)}
        .pmdash-btns{display:flex;gap:10px;flex-wrap:wrap}
        .pmdash-btn{border:none;border-radius:10px;padding:10px 14px;font-weight:900;cursor:pointer;background:#2a063f;color:#fff}
        .pmdash-btn.pmdash-ghost{background:transparent;color:#2a063f;border:1px solid rgba(0,0,0,.2)}
        .pmdash-btn.pmdash-danger{background:#5b0b0b}
        .pmdash-status{font-size:12px;opacity:.75;margin-left:auto}
        .pmdash-taskrow{display:flex;gap:8px;align-items:center;margin-bottom:8px}
        .pmdash-taskrow input[type="text"]{flex:1;min-width:220px}
        .pmdash-taskrow button{padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.18);background:#fff;cursor:pointer}
        @media (max-width: 860px){
          .pmdash-app{grid-template-columns:1fr}
          .pmdash-tabs{flex-direction:row;overflow:auto}
          .pmdash-tab{height:auto;min-width:160px}
          .pmdash-cols{grid-template-columns:1fr}
        }
      `;
      document.head.appendChild(style);
    }

    // ====== HTML (injected into each placeholder) ======
    function renderShell(el) {
      el.innerHTML = `
        <div class="pmdash-wrap">
          <div class="pmdash-app">
            <div class="pmdash-tabs" data-tabs></div>
            <div class="pmdash-panel">
              <div class="pmdash-row">
                <div class="pmdash-status" data-status>Loading…</div>
              </div>

              <h2 class="pmdash-title" contenteditable="true" data-title>Project Title</h2>

              <div class="pmdash-row">
                <input type="text" placeholder="Client" data-client />
                <input type="text" placeholder="Month, Year" data-monthyear />
              </div>

              <textarea class="pmdash-textarea" placeholder="Description" data-desc></textarea>

              <div class="pmdash-cols">
                <div class="pmdash-box">
                  <h4>Goals</h4>
                  <div data-goals></div>
                </div>
                <div class="pmdash-box">
                  <h4>Milestones</h4>
                  <div data-miles></div>
                </div>
              </div>

              <div class="pmdash-hr"></div>

              <div class="pmdash-box">
                <h4>Tasks</h4>
                <div data-tasks></div>
                <button class="pmdash-btn pmdash-ghost" data-addtask>+ Add task</button>
              </div>

              <div class="pmdash-hr"></div>

              <div class="pmdash-btns">
                <button class="pmdash-btn" data-save>save</button>
                <button class="pmdash-btn pmdash-ghost" data-print>print</button>
                <button class="pmdash-btn pmdash-ghost" data-archive>archive</button>
                <button class="pmdash-btn pmdash-danger" data-delete>delete</button>
                <div class="pmdash-status" data-status2></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ====== Main app per instance ======
    async function initInstance(host) {
      if (host.__pmdashMounted) return;
      host.__pmdashMounted = true;

      injectCSSOnce();
      renderShell(host);

      const $ = (sel) => host.querySelector(sel);
      const tabsEl = $("[data-tabs]");
      const statusEl = $("[data-status]");
      const status2El = $("[data-status2]");

      const titleEl = $("[data-title]");
      const clientEl = $("[data-client]");
      const monthEl = $("[data-monthyear]");
      const descEl = $("[data-desc]");

      const goalsEl = $("[data-goals]");
      const milesEl = $("[data-miles]");
      const tasksEl = $("[data-tasks]");

      const saveBtn = $("[data-save]");
      const printBtn = $("[data-print]");
      const archiveBtn = $("[data-archive]");
      const deleteBtn = $("[data-delete]");
      const addTaskBtn = $("[data-addtask]");

      // Supabase
      await loadSupabase();
      window.__PMDASH__ = window.__PMDASH__ || {};
      const sb =
        window.__PMDASH__.sb ||
        (window.__PMDASH__.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));

      // State
      let projects = [];
      let tasksByProject = new Map();
      let activeId = null;
      let autosaveTimer = null;

      const setStatus = (t, ok = true) => {
        statusEl.textContent = t;
        status2El.textContent = ok ? "" : "error";
      };

      const activeProject = () => projects.find((p) => p.id === activeId) || null;

      function tabLabel(p) {
        const t = (p.title || "").trim();
        return t ? t : `Project ${p.position || ""}`.trim();
      }

      function renderTabs() {
        tabsEl.innerHTML = "";
        projects
          .filter((p) => !p.archived_at)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .forEach((p) => {
            const d = document.createElement("div");
            d.className = "pmdash-tab" + (p.id === activeId ? " pmdash-active" : "");
            d.textContent = tabLabel(p);
            d.onclick = () => {
              activeId = p.id;
              renderTabs();
              renderEditor();
            };
            tabsEl.appendChild(d);
          });
      }

      function render3Inputs(container, values, placeholderBase, onChange) {
        container.innerHTML = "";
        ensure3(values).forEach((val, i) => {
          const inp = document.createElement("input");
          inp.type = "text";
          inp.placeholder = `${placeholderBase} ${i + 1}`;
          inp.value = val || "";
          inp.addEventListener("input", () => onChange(i, inp.value));
          container.appendChild(inp);
        });
      }

      function renderTasks() {
        tasksEl.innerHTML = "";
        const list = (tasksByProject.get(activeId) || []).slice().sort((a, b) => (a.sort_index || 0) - (b.sort_index || 0));

        list.forEach((t) => {
          const row = document.createElement("div");
          row.className = "pmdash-taskrow";

          const inp = document.createElement("input");
          inp.type = "text";
          inp.placeholder = "task…";
          inp.value = t.title || "";
          inp.addEventListener("input", () => {
            t.title = inp.value;
            // tasks are saved on manual Save (simple + stable)
          });

          const del = document.createElement("button");
          del.textContent = "✕";
          del.title = "remove";
          del.onclick = () => {
            const arr = tasksByProject.get(activeId) || [];
            tasksByProject.set(activeId, arr.filter((x) => x.id !== t.id));
            renderTasks();
          };

          row.appendChild(inp);
          row.appendChild(del);
          tasksEl.appendChild(row);
        });
      }

      function renderEditor() {
        const p = activeProject();
        if (!p) return;

        titleEl.textContent = p.title || "Project Title";
        clientEl.value = p.client || "";
        monthEl.value = p.month_year || "";
        descEl.value = p.description || "";

        render3Inputs(goalsEl, p.goals, "goal", (i, v) => {
          p.goals = ensure3(p.goals);
          p.goals[i] = v;
          queueAutosave();
        });

        render3Inputs(milesEl, p.milestones, "date", (i, v) => {
          p.milestones = ensure3(p.milestones);
          p.milestones[i] = v;
          queueAutosave();
        });

        renderTasks();
      }

      function queueAutosave() {
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => saveProjectOnly(true), 650);
      }

      async function saveProjectOnly(silent) {
        const p = activeProject();
        if (!p) return;

        // read current editor state
        p.title = (titleEl.textContent || "").trim() === "Project Title" ? "" : (titleEl.textContent || "").trim();
        p.client = clientEl.value || "";
        p.month_year = monthEl.value || "";
        p.description = descEl.value || "";
        p.goals = ensure3(p.goals);
        p.milestones = ensure3(p.milestones);

        if (!silent) setStatus("Saving…");
        const { error } = await sb.from("projects").upsert(p, { onConflict: "id" });
        if (error) {
          console.error(error);
          setStatus("Save failed", false);
          return;
        }
        if (!silent) setStatus("Saved");
        renderTabs();
      }

      async function saveAll() {
        await saveProjectOnly(false);

        const p = activeProject();
        if (!p) return;

        setStatus("Syncing tasks…");

        const local = tasksByProject.get(p.id) || [];
        const normalized = local.map((t, idx) => ({
          id: t.id,
          project_id: p.id,
          title: (t.title || "").trim(),
          priority: Number(t.priority || 3),
          is_done: !!t.is_done,
          sort_index: Number.isFinite(t.sort_index) ? t.sort_index : idx,
        }));

        const { data: existing, error: exErr } = await sb.from("tasks").select("id").eq("project_id", p.id);
        if (exErr) {
          console.error(exErr);
          setStatus("Task load failed", false);
          return;
        }

        const existingIds = new Set((existing || []).map((x) => x.id));
        const newIds = new Set(normalized.map((x) => x.id));

        const toDelete = [...existingIds].filter((id) => !newIds.has(id));
        if (toDelete.length) {
          const { error: delErr } = await sb.from("tasks").delete().in("id", toDelete);
          if (delErr) {
            console.error(delErr);
            setStatus("Task delete failed", false);
            return;
          }
        }

        if (normalized.length) {
          const { error: upErr } = await sb.from("tasks").upsert(normalized, { onConflict: "id" });
          if (upErr) {
            console.error(upErr);
            setStatus("Task save failed", false);
            return;
          }
        }

        setStatus("Saved");
      }

      async function loadAll() {
        setStatus("Loading…");
        const { data: pData, error: pErr } = await sb.from("projects").select("*").order("position", { ascending: true });
        if (pErr) {
          console.error(pErr);
          setStatus("Projects load failed", false);
          return;
        }
        projects = pData || [];

        // Ensure 4 default projects
        if (projects.length < 4) {
          const missing = 4 - projects.length;
          const maxPos = projects.length ? Math.max(...projects.map((p) => p.position || 0)) : 0;
          const inserts = [];
          for (let i = 1; i <= missing; i++) {
            inserts.push({
              position: maxPos + i,
              title: "",
              client: "",
              month_year: "",
              description: "",
              goals: ["", "", ""],
              milestones: ["", "", ""],
              theme: { ...DEFAULT_THEME },
              archived_at: null,
            });
          }
          const { error: insErr } = await sb.from("projects").insert(inserts);
          if (insErr) {
            console.error(insErr);
            setStatus("Seed failed", false);
            return;
          }
          return loadAll();
        }

        const ids = projects.map((p) => p.id);
        const { data: tData, error: tErr } = await sb.from("tasks").select("*").in("project_id", ids);
        if (tErr) {
          console.error(tErr);
          setStatus("Tasks load failed", false);
          return;
        }

        tasksByProject.clear();
        projects.forEach((p) => tasksByProject.set(p.id, []));
        (tData || []).forEach((t) => {
          const arr = tasksByProject.get(t.project_id) || [];
          arr.push({ ...t });
          tasksByProject.set(t.project_id, arr);
        });

        activeId = projects.find((p) => !p.archived_at)?.id || projects[0].id;
        renderTabs();
        renderEditor();
        setStatus("Ready");
      }

      // ====== bindings ======
      titleEl.addEventListener("input", () => {
        const p = activeProject();
        if (!p) return;
        p.title = (titleEl.textContent || "").trim();
        renderTabs();
        queueAutosave();
      });
      clientEl.addEventListener("input", queueAutosave);
      monthEl.addEventListener("input", queueAutosave);
      descEl.addEventListener("input", queueAutosave);

      addTaskBtn.addEventListener("click", () => {
        const p = activeProject();
        if (!p) return;
        const arr = tasksByProject.get(p.id) || [];
        arr.push({
          id: uid(),
          project_id: p.id,
          title: "",
          priority: 3,
          is_done: false,
          sort_index: arr.length ? Math.max(...arr.map((x) => x.sort_index || 0)) + 1 : 0,
        });
        tasksByProject.set(p.id, arr);
        renderTasks();
      });

      saveBtn.addEventListener("click", saveAll);
      printBtn.addEventListener("click", () => window.print());

      archiveBtn.addEventListener("click", async () => {
        const p = activeProject();
        if (!p) return;
        p.archived_at = new Date().toISOString();
        await saveProjectOnly(false);
        await loadAll();
      });

      deleteBtn.addEventListener("click", async () => {
        const p = activeProject();
        if (!p) return;
        const ok = confirm("Delete this project and its tasks? This cannot be undone.");
        if (!ok) return;
        setStatus("Deleting…");
        const { error } = await sb.from("projects").delete().eq("id", p.id);
        if (error) {
          console.error(error);
          setStatus("Delete failed", false);
          return;
        }
        await loadAll();
      });

      // Go
      await loadAll();
    }

    // ====== Mount on Squarespace page load ======
    async function mount() {
      const targets = document.querySelectorAll("[data-pmdash]");
      if (!targets.length) return;
      for (const el of targets) await initInstance(el);
    }

    // Squarespace 7.1 AJAX-safe
    document.addEventListener("DOMContentLoaded", mount);
    document.addEventListener("page:load", mount);
  } catch (e) {
    console.error("[pmdash] fatal:", e);
  }
})();

