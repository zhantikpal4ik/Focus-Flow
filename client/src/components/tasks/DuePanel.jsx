// src/components/tasks/DuePanel.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

export default function DuePanel({ onSelectTask, selectedTaskId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const token = localStorage.getItem("token");
      if (!token) { setTasks([]); return; }
      const data = await api("/api/tasks", { token });
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (e) {
      setErr(e.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  // initial + on focus + on custom "tasks:changed"
  useEffect(() => {
    load();
    const onFocus = () => load();
    const onChanged = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("tasks:changed", onChanged);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("tasks:changed", onChanged);
    };
  }, []);

  const display = useMemo(() => {
    const now = new Date();
    const inDays = (d) => Math.floor((d - new Date(now.toDateString())) / 86400000);

    const notDone = tasks.filter(t => (t.status || "todo") !== "done");

    // separate with/without due date
    const withDue = [];
    const noDue = [];
    for (const t of notDone) {
      if (t.due) withDue.push(t); else noDue.push(t);
    }

    // keep due: today/overdue/next 7 days
    const soon = withDue
      .map(t => ({ t, due: new Date(t.due) }))
      .filter(({ due }) => inDays(due) <= 7) // includes negative (overdue) & today (0)
      .sort((a, b) => {
        // priority sort: high > med > low
        const pri = { high: 0, med: 1, low: 2 };
        const pa = pri[(a.t.priority || "med")] ?? 1;
        const pb = pri[(b.t.priority || "med")] ?? 1;
        if (pa !== pb) return pa - pb;
        return a.due - b.due;
      })
      .map(x => x.t);

    // final list (cap to ~6)
    const combined = [...soon, ...noDue].slice(0, 6);
    return combined;
  }, [tasks]);

  return (
    <div>
      <div style={head}>
        <div style={{fontWeight:700}}>Due soon</div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <button style={miniBtn} onClick={load} title="Refresh">⟳</button>
        </div>
      </div>

      {loading && <div style={{opacity:.8}}>Loading…</div>}
      {err && <div style={{color:"#f87171"}}>Error: {err}</div>}

      {!loading && !err && display.length === 0 && (
        <div style={{opacity:.8}}>You have no current tasks.</div>
      )}

      <ul style={list}>
        {display.map(t => (
          <li key={t._id} style={{
            ...item,
            outline: selectedTaskId === t._id ? "2px solid #2563eb" : "1px solid #2a2a2a"
          }}>
            <div style={{display:"grid", gap:2}}>
              <div style={{fontWeight:700, lineHeight:1.2}}>{t.title}</div>
              <div style={{fontSize:12, opacity:.85}}>
                {renderMeta(t)}
              </div>
            </div>
            <button
              style={pickBtn}
              onClick={() => onSelectTask ? onSelectTask(t) : null}
              title="Use in timer"
            >
              Use
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderMeta(t) {
  const bits = [];
  if (t.due) {
    const d = new Date(t.due);
    const today = new Date(new Date().toDateString());
    const delta = Math.floor((d - today) / 86400000);
    let label = d.toLocaleDateString();
    if (delta === 0) label = "Today";
    else if (delta === 1) label = "Tomorrow";
    else if (delta < 0) label = `${Math.abs(delta)}d overdue`;
    bits.push(label);
  } else {
    bits.push("No due");
  }
  bits.push((t.priority || "med").toUpperCase());
  if (t.estimatePoms) {
    const done = t.actualPoms || 0;
    bits.push(`${done}/${t.estimatePoms} 🍅`);
  }
  return bits.join(" · ");
}

/* styles */
const head = { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 };
const list = { listStyle:"none", padding:0, margin:0, display:"grid", gap:8 };
const item = {
  padding:"10px 12px",
  borderRadius:12,
  background:"rgba(255,255,255,.04)",
  display:"flex",
  alignItems:"center",
  justifyContent:"space-between",
  gap:12
};
const miniBtn = {
  padding:"6px 8px",
  borderRadius:8,
  border:"1px solid #2a2a2a",
  background:"#151515",
  color:"#e5e7eb",
  cursor:"pointer"
};
const pickBtn = {
  padding:"8px 10px",
  borderRadius:10,
  border:"1px solid #2a2a2a",
  background:"#111827",
  color:"#e5e7eb",
  cursor:"pointer"
};
