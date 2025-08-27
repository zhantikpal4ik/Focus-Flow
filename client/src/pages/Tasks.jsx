// src/pages/Tasks.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000/api/tasks";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");         // all | today | upcoming | done
  const [sort, setSort] = useState("dueAsc");    // dueAsc | prioDesc | createdDesc
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // composer
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("med");
  const [estimatePoms, setEstimatePoms] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  async function load() {
    try {
      setLoading(true);
      setErr("");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tasks");
      setTasks(data.tasks || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* on mount */ }, []); // eslint-disable-line

  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          due: due || null,
          priority,
          estimatePoms: estimatePoms ? Number(estimatePoms) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not add task");
      }
      setTitle(""); setDue(""); setPriority("med"); setEstimatePoms("");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function toggleDone(t) {
    try {
      const res = await fetch(`${API}/${t._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: t.status === "done" ? "todo" : "done" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not update task");
      }
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function remove(id) {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete task");
      }
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  // derived view
  const todayKey = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => {
    let list = tasks;

    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(qq) ||
        (t.notes || "").toLowerCase().includes(qq)
      );
    }

    if (tab === "today") {
      list = list.filter(t => (t.due || "").slice(0, 10) === todayKey && t.status !== "done");
    } else if (tab === "upcoming") {
      list = list.filter(t => t.due && t.due.slice(0,10) > todayKey && t.status !== "done");
    } else if (tab === "done") {
      list = list.filter(t => t.status === "done");
    }

    if (sort === "dueAsc") {
      list = [...list].sort((a, b) => (a.due || "9999") > (b.due || "9999") ? 1 : -1);
    } else if (sort === "prioDesc") {
      const weight = { high: 3, med: 2, low: 1 };
      list = [...list].sort((a, b) => (weight[b.priority]||0) - (weight[a.priority]||0));
    } else if (sort === "createdDesc") {
      list = [...list].sort((a, b) => (b.createdAt||"") > (a.createdAt||"") ? 1 : -1);
    }

    return list;
  }, [tasks, q, tab, sort, todayKey]);

  return (
    <div style={wrap}>
      <header style={topbar}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <button onClick={() => navigate("/")} style={backBtn}>← Back to Timer</button>
          <h2 style={{margin:0}}>Tasks</h2>
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <input
            placeholder="Search…"
            value={q}
            onChange={e=>setQ(e.target.value)}
            style={input}
          />
          <select value={tab} onChange={e=>setTab(e.target.value)} style={select}>
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="done">Done</option>
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={select}>
            <option value="dueAsc">Sort by due ↑</option>
            <option value="prioDesc">Sort by priority</option>
            <option value="createdDesc">Newest first</option>
          </select>
          <button onClick={load} style={btnGhost}>Refresh</button>
        </div>
      </header>

      {err && <div style={errBox}>⚠️ {err}</div>}

      <form onSubmit={add} style={composer}>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Add a task…"
          required
          style={{...input, flex:1}}
        />
        <input type="date" value={due} onChange={e=>setDue(e.target.value)} style={input} />
        <select value={priority} onChange={e=>setPriority(e.target.value)} style={select}>
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="number"
          min="1"
          placeholder="Est 🍅"
          value={estimatePoms}
          onChange={e=>setEstimatePoms(e.target.value)}
          style={{...input, width:90}}
        />
        <button style={btnPrimary} disabled={loading}>Add</button>
      </form>

      {loading ? (
        <div style={{opacity:.8}}>Loading…</div>
      ) : (
        <ul style={{listStyle:"none", padding:0, display:"grid", gap:10}}>
          {filtered.map(t => {
            const isOverdue = t.status !== "done" && t.due && t.due.slice(0,10) < todayKey;
            return (
              <li key={t._id} style={row}>
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <input type="checkbox" checked={t.status==='done'} onChange={()=>toggleDone(t)} />
                  <div>
                    <div style={{fontWeight:700, textDecoration: t.status==='done' ? 'line-through' : 'none'}}>
                      {t.title}
                    </div>
                    <div style={{fontSize:12, opacity:.85, display:"flex", gap:8, flexWrap:"wrap"}}>
                      <Badge tone={t.priority === "high" ? "red" : t.priority === "med" ? "amber" : "slate"}>
                        {t.priority}
                      </Badge>
                      <Badge tone={isOverdue ? "red" : "slate"}>
                        {t.due ? new Date(t.due).toLocaleDateString() : "No due"}
                      </Badge>
                      {(t.estimatePoms || t.actualPoms) && (
                        <Badge tone="indigo">{t.actualPoms || 0}/{t.estimatePoms || "?"} 🍅</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button onClick={()=>remove(t._id)} title="Delete" style={btnDanger}>Delete</button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && !loading && (
            <li style={{opacity:.7, padding:"12px 4px"}}>Nothing here. Add a task 🔥</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Badge({ tone="slate", children }) {
  const colors = {
    red:   { bg:"rgba(239,68,68,.18)",  bd:"rgba(239,68,68,.35)",  fg:"#fecaca" },
    amber: { bg:"rgba(245,158,11,.18)", bd:"rgba(245,158,11,.35)", fg:"#fde68a" },
    indigo:{ bg:"rgba(99,102,241,.18)", bd:"rgba(99,102,241,.35)", fg:"#c7d2fe" },
    slate: { bg:"rgba(148,163,184,.16)", bd:"rgba(148,163,184,.28)", fg:"#e5e7eb" }
  }[tone];
  return (
    <span style={{
      borderRadius:999, padding:"2px 8px", fontSize:12,
      background:colors.bg, border:`1px solid ${colors.bd}`, color:colors.fg
    }}>{children}</span>
  );
}

/* styles */
const wrap = { maxWidth: 900, margin: "32px auto", padding: "0 16px" };
const topbar = { display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:12 };
const composer = { display:"grid", gridTemplateColumns:"1fr 150px 140px 100px auto", gap:8, margin:"10px 0 18px" };
const row = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", border:"1px solid #2f2f2f", borderRadius:12, background:"rgba(255,255,255,.035)" };
const input = { padding:"10px 12px", borderRadius:8, border:"1px solid #2a2a2a", background:"#141414", color:"#fff", outline:"none" };
const select = input;
const btnPrimary = { padding:"10px 14px", borderRadius:8, border:"none", background:"#2563eb", color:"#fff", fontWeight:700, cursor:"pointer" };
const btnGhost = { padding:"10px 12px", borderRadius:8, border:"1px solid #2f2f2f", background:"transparent", color:"#fff", cursor:"pointer" };
const btnDanger = { ...btnGhost, border:"1px solid rgba(239,68,68,.45)", color:"#fecaca" };
const errBox = { marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.35)", color: "#fecaca" };
const backBtn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #2f2f2f", background: "#1a1a1a", color: "#fff", cursor: "pointer" };
