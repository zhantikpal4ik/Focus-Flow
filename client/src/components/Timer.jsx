// src/components/Timer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import useInterval from "../hooks/useInterval";
import { api } from "../services/api";

// Icons / assets
import startIcon from "../assets/icons/start.png";
import pauseIcon from "../assets/icons/start.png"; 
import resetIcon from "../assets/icons/reset.png";
import settingsIcon from "../assets/icons/setting.png";
import forestBg from "../assets/icons/forest.jpg";
import rainBg from "../assets/icons/rain.jpg";
import cafeBg from "../assets/icons/cafe.jpg";
import darkBg from "../assets/icons/dark.jpg";


/* ===================== Themes & Sounds ===================== */
const THEMES = {
  dark:   { name: "Dark",   bg: `url(${darkBg}) center/cover no-repeat` },
  rain:   { name: "Rain",   bg: `url(${rainBg}) center/cover no-repeat` },
  cafe:   { name: "Café",   bg: `url(${cafeBg}) center/cover no-repeat` },
  forest: { name: "Forest", bg: `url(${forestBg}) center/cover no-repeat` },
};

const ALARMS = {
  ding:  { name: "Ding",  src: "/assets/sounds/ding.mp3" },
  bell:  { name: "Bell",  src: "/assets/sounds/bell.mp3" },
  chime: { name: "Chime", src: "/assets/sounds/chime.mp3" },
};

const DEFAULTS = { workTime: 25, shortBreak: 5, longBreak: 15 };

export default function Timer({ selectedTaskId = null, selectedTaskTitle = null }) {
  // --- core timer state ---
  const [mode, setMode] = useState("grind"); // 'grind' | 'shortBreak' | 'longBreak'
  const [running, setRunning] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULTS.workTime * 60);
  const [showSettings, setShowSettings] = useState(false);

  // --- UI prefs (localStorage backed) ---
  const [themeKey, setThemeKey]   = useState(localStorage.getItem("themeKey")   || "dark");
  const [alarmKey, setAlarmKey]   = useState(localStorage.getItem("alarmKey")   || "ding");
  const [autoLoop, setAutoLoop]   = useState(localStorage.getItem("autoLoop")   === "1");
  const [longEvery, setLongEvery] = useState(Number(localStorage.getItem("longEvery") || 4));
  const [workBlocksSinceLong, setWorkBlocksSinceLong] = useState(0);

  const alarmRef = useRef(null);

  // Load backend settings (only the times); keep UI prefs in localStorage
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const data = await api("/api/settings", { token });
        const s = data.settings || data.user?.pomodoroSettings || DEFAULTS;
        const ui = data.ui || {};
        setSettings({
          workTime: s.workTime ?? 25,
          shortBreak: s.shortBreak ?? 5,
          longBreak: s.longBreak ?? 15,
        });
        setThemeKey(ui.themeKey ?? "dark");
        setAlarmKey(ui.alarmKey ?? "ding");
        setAutoLoop(!!ui.autoLoop);
        setLongEvery(ui.longEvery ?? 4);
      } catch { /* ignore */ }
    })();
  }, []);

  // Apply wallpaper
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = THEMES[themeKey]?.bg || THEMES.dark.bg;
    return () => { document.body.style.background = prev; };
  }, [themeKey]);

  // Reset countdown when mode or settings change
  useEffect(() => {
    const mins =
      mode === "grind" ? settings.workTime :
      mode === "shortBreak" ? settings.shortBreak :
      settings.longBreak;
    setSecondsLeft(mins * 60);
    setRunning(false);
  }, [mode, settings]);

  // Tick each second when running
  useInterval(() => {
    if (!running) return;
    setSecondsLeft((s) => {
      if (s <= 1) {
        onSessionComplete();
        return 0;
      }
      return s - 1;
    });
  }, 1000);

  const totalSeconds = useMemo(() => (
    (mode === "grind" ? settings.workTime :
     mode === "shortBreak" ? settings.shortBreak :
     settings.longBreak) * 60
  ), [mode, settings]);

  const progress = useMemo(() => {
    const p = 1 - (secondsLeft / Math.max(1, totalSeconds));
    return Math.max(0, Math.min(1, p));
  }, [secondsLeft, totalSeconds]);

  // Ring color by mode (work/short/long)
  const ringColor = mode === "grind" ? "#60a5fa" : mode === "shortBreak" ? "#34d399" : "#a78bfa";

  function format(total) {
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function toggleTimer() { setRunning(r => !r); }

  function resetTimer() {
    const mins =
      mode === "grind" ? settings.workTime :
      mode === "shortBreak" ? settings.shortBreak :
      settings.longBreak;
    setSecondsLeft(mins * 60);
    setRunning(false);
  }

  function nextPhaseAfterWork() {
    const nextIsLong = ((workBlocksSinceLong + 1) % Math.max(2, longEvery)) === 0;
    setWorkBlocksSinceLong(x => x + 1);
    setMode(nextIsLong ? "longBreak" : "shortBreak");
  }
  function nextPhaseAfterBreak() { setMode("grind"); }

  function playAlarm() {
    if (alarmRef.current) {
      alarmRef.current.currentTime = 0;
      alarmRef.current.play().catch(() => {});
    }
  }

  async function onSessionComplete() {
    setRunning(false);

    const blockMinutes =
      mode === "grind" ? settings.workTime :
      mode === "shortBreak" ? settings.shortBreak :
      settings.longBreak;

    const dur = blockMinutes * 60;

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api("/api/sessions", {
          method: "POST",
          token,
          body: {
            duration: dur,
            mode: mode === "grind" ? "work" : mode,
            taskId: mode === "grind" ? (typeof selectedTaskId === "string" ? selectedTaskId : null) : null,
            completedAt: new Date(),
          },
        });
      }
    } catch (e) {
      console.warn("Failed to save session:", e.message);
    }

    playAlarm();

    if (autoLoop) {
      if (mode === "grind") {
        nextPhaseAfterWork();
        setTimeout(() => setRunning(true), 0);
      } else {
        nextPhaseAfterBreak();
        setTimeout(() => setRunning(true), 0);
      }
    } else {
      if (mode === "grind") setMode("shortBreak");
      else if (mode === "shortBreak") setMode("grind");
      else setMode("grind");
    }
  }

  async function saveSettings(nextTimes, uiPrefs) {
    setSettings(nextTimes);
    setThemeKey(uiPrefs.themeKey);
    setAlarmKey(uiPrefs.alarmKey);
    setAutoLoop(uiPrefs.autoLoop);
    setLongEvery(uiPrefs.longEvery);

    localStorage.setItem("themeKey", uiPrefs.themeKey);
    localStorage.setItem("alarmKey", uiPrefs.alarmKey);
    localStorage.setItem("autoLoop", uiPrefs.autoLoop ? "1" : "0");
    localStorage.setItem("longEvery", String(uiPrefs.longEvery));

    setShowSettings(false);

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api("/api/settings", {
          method: "POST",
          token,
          body: { pomodoroSettings: nextTimes, ui: uiPrefs },
        });
      }
    } catch (e) {
      console.warn("Save settings failed:", e.message);
    }
  }

  const mmss = format(secondsLeft);

  return (
    <div style={frame}>
      <audio ref={alarmRef} src={ALARMS[alarmKey]?.src} preload="auto" />

      <div style={panel}>
        {/* Tabs */}
        <div style={tabs}>
          <Tab label="Pomodoro"    active={mode==="grind"}      onClick={() => setMode("grind")} />
          <Tab label="Short Break" active={mode==="shortBreak"} onClick={() => setMode("shortBreak")} />
          <Tab label="Long Break"  active={mode==="longBreak"}  onClick={() => setMode("longBreak")} />
        </div>

        {/* Progress ring + time */}
        <div style={ringWrap}>
          <div
            style={{
              ...ring,
              background: `conic-gradient(${ringColor} ${progress*360}deg, rgba(255,255,255,.08) 0)`,
            }}
          >
            <div style={ringInner}>
              <div style={timeBlock}>
                {selectedTaskTitle && (
                  <div style={taskLabel} title={selectedTaskTitle}>
                    Working on: <b>{selectedTaskTitle}</b>
                  </div>
                )}
                <div style={timeText}>{mmss}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={controls}>
          <PrimaryBtn onClick={toggleTimer}>
            <img src={running ? pauseIcon : startIcon} alt="" style={icon} />
            {running ? "Pause" : "Start"}
          </PrimaryBtn>
          <GhostBtn onClick={resetTimer}>
            <img src={resetIcon} alt="" style={icon} />
            Reset
          </GhostBtn>
          <GhostBtn onClick={() => setShowSettings(true)}>
            <img src={settingsIcon} alt="" style={icon} />
            Settings
          </GhostBtn>
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          times={settings}
          ui={{ themeKey, alarmKey, autoLoop, longEvery }}
          onClose={() => setShowSettings(false)}
          onSave={(next) => saveSettings(next.times, next.ui)}
        />
      )}
    </div>
  );
}

/* -------------------- SUPPORT UI -------------------- */

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.14)",
        background: active ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.04)",
        color: active ? "#dbeafe" : "#e5e7eb",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

function PrimaryBtn({ onClick, children }) {
  return <button onClick={onClick} style={btnPrimary}>{children}</button>;
}

function GhostBtn({ onClick, children }) {
  return <button onClick={onClick} style={btnGhost}>{children}</button>;
}

/* -------------------- SETTINGS MODAL -------------------- */

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,.85)" }}>{label}</span>
      {children}
    </label>
  );
}

function SettingsModal({ times, ui, onClose, onSave }) {
  const [workTime, setWorkTime]     = useState(times.workTime);
  const [shortBreak, setShortBreak] = useState(times.shortBreak);
  const [longBreak, setLongBreak]   = useState(times.longBreak);

  const [themeKey, setThemeKey]     = useState(ui.themeKey);
  const [alarmKey, setAlarmKey]     = useState(ui.alarmKey);
  const [autoLoop, setAutoLoop]     = useState(ui.autoLoop);
  const [longEvery, setLongEvery]   = useState(ui.longEvery);

  useEffect(() => {
    setWorkTime(times.workTime);
    setShortBreak(times.shortBreak);
    setLongBreak(times.longBreak);
  }, [times]);

  useEffect(() => {
    setThemeKey(ui.themeKey);
    setAlarmKey(ui.alarmKey);
    setAutoLoop(ui.autoLoop);
    setLongEvery(ui.longEvery);
  }, [ui]);

  function save() {
    onSave({
      times: { workTime: +workTime, shortBreak: +shortBreak, longBreak: +longBreak },
      ui:    { themeKey, alarmKey, autoLoop, longEvery: Math.max(2, Math.floor(+longEvery || 4)) }
    });
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={(e)=>e.stopPropagation()}>
        <div style={s.headerRow}>
          <h3 style={s.title}>Settings</h3>
          <button type="button" onClick={onClose} style={s.iconClose} aria-label="Close">✕</button>
        </div>

        <h4 style={s.section}>Pomodoro Durations</h4>
        <div style={s.grid3}>
          <Field label="Pomodoro (min)">
            <input type="number" min="1" value={workTime} onChange={e=>setWorkTime(e.target.value)} style={s.input}/>
          </Field>
          <Field label="Short Break (min)">
            <input type="number" min="1" value={shortBreak} onChange={e=>setShortBreak(e.target.value)} style={s.input}/>
          </Field>
          <Field label="Long Break (min)">
            <input type="number" min="1" value={longBreak} onChange={e=>setLongBreak(e.target.value)} style={s.input}/>
          </Field>
        </div>

        <div style={s.divider}/>

        <h4 style={s.section}>Appearance & Behavior</h4>
        <div style={s.grid2}>
          <Field label="Theme">
            <select value={themeKey} onChange={e=>setThemeKey(e.target.value)} style={s.select}>
              {Object.entries(THEMES).map(([k,t]) => <option key={k} value={k}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Alarm Sound">
            <select value={alarmKey} onChange={e=>setAlarmKey(e.target.value)} style={s.select}>
              {Object.entries(ALARMS).map(([k,a]) => <option key={k} value={k}>{a.name}</option>)}
            </select>
          </Field>
          <div style={s.colSpan2}>
            <label style={s.checkRow}>
              <input type="checkbox" checked={autoLoop} onChange={(e)=>setAutoLoop(e.target.checked)} />
              <span>Auto loop (Work → Short → Work …)</span>
            </label>
          </div>
          <Field label="Long break every">
            <input type="number" min="2" value={longEvery} onChange={e=>setLongEvery(e.target.value)} style={s.input}/>
          </Field>
        </div>

        <div style={s.actions}>
          <button type="button" onClick={onClose} style={s.btnGhost}>Close</button>
          <button type="button" onClick={save} style={s.btnPrimary}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- STYLES -------------------- */

const frame = { textAlign:"center", padding: 8, width: "100%" };

const panel = {
  width: "min(520px, 92vw)",
  margin: "0 auto",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "linear-gradient(180deg, rgba(17,20,28,.75), rgba(11,13,19,.65))",
  backdropFilter: "blur(10px)",
  boxShadow: "0 30px 80px rgba(0,0,0,.45)"
};

const tabs = { display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 };

const ringWrap = { display: "grid", placeItems: "center", padding: "4px 0 10px" };
const ring = {
  width: 280,
  height: 280,
  borderRadius: "50%",
  padding: 12,
  boxShadow: "0 8px 40px rgba(0,0,0,.35)"
};
const ringInner = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,.08), rgba(0,0,0,.45))",
  boxShadow: "inset 0 0 40px rgba(0,0,0,.35)"
};

const timeBlock = { display: "grid", gap: 6, placeItems: "center" };
const taskLabel = { fontSize: 12, opacity: .85, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const timeText = { fontSize: 72, fontWeight: 900, letterSpacing: 1, textShadow: "0 2px 16px rgba(0,0,0,.5)" };

const controls = { display: "flex", gap: 10, justifyContent: "center", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,.06)", marginTop: 10 };
const icon = { width: 18, height: 18, objectFit: "contain", marginRight: 8, verticalAlign: "-3px" };

const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(180deg, #3b82f6, #2563eb)",
  color: "#fff",
  fontWeight: 800,
  letterSpacing: .2,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(37,99,235,.35)"
};

const btnGhost = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  color: "#e5e7eb",
  cursor: "pointer"
};

/* Settings modal styles */
const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    backdropFilter: "blur(6px)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 50
  },
  panel: {
    width: "min(780px, 96vw)",
    background: "rgba(20,22,30,.72)",
    color: "#eef2ff",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 16,
    boxShadow: "0 30px 80px rgba(0,0,0,.45)",
    padding: 18
  },
  headerRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 4 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: .2 },
  iconClose: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,.7)",
    fontSize: 20,
    cursor: "pointer"
  },
  section: { margin: "10px 0 8px", fontSize: 14, opacity: .9, fontWeight: 700 },
  divider: { height: 1, background: "rgba(255,255,255,.08)", margin: "12px 0" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 },
  colSpan2: { gridColumn: "1 / -1" },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    outline: "none",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    outline: "none",
    appearance: "none"
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)"
  },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 },
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.22)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer"
  },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,.28)"
  },
};
