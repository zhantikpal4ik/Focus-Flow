import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

// If you defined THEMES/ALARMS elsewhere, you can import them.
// For convenience, define names here to render selects:
const THEME_OPTIONS = [
  { value: "dark", name: "Dark" },
  { value: "rain", name: "Rain" },
  { value: "cafe", name: "Café" },
  { value: "forest", name: "Forest" },
];

const ALARM_OPTIONS = [
  { value: "ding", name: "Ding" },
  { value: "bell", name: "Bell" },
  { value: "chime", name: "Chime" },
];

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  // settings
  const [workTime, setWorkTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);

  // ui
  const [themeKey, setThemeKey] = useState("dark");
  const [alarmKey, setAlarmKey] = useState("ding");
  const [autoLoop, setAutoLoop] = useState(false);
  const [longEvery, setLongEvery] = useState(4);

  useEffect(() => {
    (async () => {
      try {
        const me = await api("/api/me", { token });
        setEmail(me.email);
        setCreatedAt(me.createdAt ? new Date(me.createdAt).toLocaleDateString() : "");

        const s = me.settings || {};
        setWorkTime(s.workTime ?? 25);
        setShortBreak(s.shortBreak ?? 5);
        setLongBreak(s.longBreak ?? 15);

        const ui = me.ui || {};
        setThemeKey(ui.themeKey ?? "dark");
        setAlarmKey(ui.alarmKey ?? "ding");
        setAutoLoop(!!ui.autoLoop);
        setLongEvery(ui.longEvery ?? 4);
      } catch (e) {
        setMsg(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function saveAll() {
    setSaving(true);
    setMsg("");
    try {
      await api("/api/settings", {
        method: "POST",
        token,
        body: {
          pomodoroSettings: {
            workTime: Number(workTime),
            shortBreak: Number(shortBreak),
            longBreak: Number(longBreak),
          },
          ui: {
            themeKey,
            alarmKey,
            autoLoop,
            longEvery: Math.max(2, parseInt(longEvery, 10) || 4),
          },
        },
      });
      setMsg("Saved ✅");
    } catch (e) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/auth");
  }

  if (loading) {
    return <div style={wrap}><div style={{ opacity:.8 }}>Loading…</div></div>;
  }

  return (
    <div style={wrap}>
      <header style={header}>
        <div style={{ fontWeight:800, letterSpacing:.3 }}>Your Profile</div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
          <button style={ghostBtn} onClick={()=>navigate("/timer")}>Back to Timer</button>
          <button style={dangerBtn} onClick={logout}>Log out</button>
        </div>
      </header>

      <div style={card}>
        {/* Account */}
        <section style={section}>
          <h3 style={h3}>Account</h3>
          <div style={grid2}>
            <Field label="Email">
              <input value={email} disabled style={input} />
            </Field>
            <Field label="Member since">
              <input value={createdAt || "—"} disabled style={input} />
            </Field>
          </div>
        </section>

        <div style={divider}/>

        {/* Durations */}
        <section style={section}>
          <h3 style={h3}>Pomodoro Durations</h3>
          <div style={grid3}>
            <Field label="Pomodoro (min)">
              <input type="number" min="1" value={workTime} onChange={e=>setWorkTime(e.target.value)} style={input}/>
            </Field>
            <Field label="Short Break (min)">
              <input type="number" min="1" value={shortBreak} onChange={e=>setShortBreak(e.target.value)} style={input}/>
            </Field>
            <Field label="Long Break (min)">
              <input type="number" min="1" value={longBreak} onChange={e=>setLongBreak(e.target.value)} style={input}/>
            </Field>
          </div>
        </section>

        <div style={divider}/>

        {/* UI */}
        <section style={section}>
          <h3 style={h3}>Appearance & Behavior</h3>
          <div style={grid2}>
            <Field label="Theme">
              <select value={themeKey} onChange={e=>setThemeKey(e.target.value)} style={select}>
                {THEME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Alarm Sound">
              <select value={alarmKey} onChange={e=>setAlarmKey(e.target.value)} style={select}>
                {ALARM_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.name}</option>)}
              </select>
            </Field>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={checkRow}>
                <input type="checkbox" checked={autoLoop} onChange={e=>setAutoLoop(e.target.checked)} />
                <span>Auto loop (Work → Short → Work …)</span>
              </label>
            </div>
            <Field label="Long break every (N work blocks)">
              <input type="number" min="2" value={longEvery} onChange={e=>setLongEvery(e.target.value)} style={input}/>
            </Field>
          </div>
        </section>

        {/* Actions */}
        <div style={actions}>
          <div style={{minHeight:20, color:"#a7f3d0"}}>{msg}</div>
          <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
            <button style={ghostBtn} onClick={()=>navigate("/timer")}>Cancel</button>
            <button style={primaryBtn} disabled={saving} onClick={saveAll}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----- small UI helpers ----- */
function Field({ label, children }) {
  return (
    <label style={{ display:"grid", gap:6 }}>
      <span style={{ fontSize:13, color:"rgba(255,255,255,.85)" }}>{label}</span>
      {children}
    </label>
  );
}

/* ----- styles ----- */
const wrap = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#0f1725,#0b1220)",
  color: "#e5e7eb",
  padding: 24,
};

const header = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
};

const card = {
  width: "min(900px, 96vw)",
  margin: "0 auto",
  background: "rgba(20,22,30,.72)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 16,
  boxShadow: "0 30px 80px rgba(0,0,0,.45)",
  padding: 18,
  backdropFilter: "blur(6px)",
};

const section = { marginBottom: 8 };
const h3 = { margin: "6px 0 10px", fontSize: 16, fontWeight: 800, opacity:.9 };
const grid2 = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };
const grid3 = { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 };
const divider = { height:1, background:"rgba(255,255,255,.08)", margin:"14px 0" };

const input = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  color: "#fff",
  outline: "none",
};
const select = { ...input, appearance:"none" };
const checkRow = {
  display:"flex", alignItems:"center", gap:10,
  padding:"10px 12px", borderRadius:10,
  border:"1px solid rgba(255,255,255,.14)", background:"rgba(255,255,255,.06)"
};

const actions = { display:"flex", alignItems:"center", gap:12, marginTop:12 };
const primaryBtn = { padding:"10px 14px", borderRadius:10, border:"none", background:"#2563eb", color:"#fff", fontWeight:700, cursor:"pointer" };
const ghostBtn   = { padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.22)", background:"transparent", color:"#fff", cursor:"pointer" };
const dangerBtn  = { padding:"10px 14px", borderRadius:10, border:"1px solid #ef4444", background:"transparent", color:"#ef4444", cursor:"pointer" };
