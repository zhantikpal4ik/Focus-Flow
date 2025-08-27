// src/pages/Pomodoro.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import ProfileMenu from "../components/ProfileMenu";
import DuePanel from "../components/tasks/DuePanel";

export default function PomodoroPage() {
  // Start with no task selected (do not read/persist localStorage)
  const [selectedTask, setSelectedTask] = useState(null);
  const navigate = useNavigate();

  // One-time cleanup: remove any old persisted selection so it can't leak in
  useEffect(() => {
    localStorage.removeItem("selectedTask");
  }, []);

  return (
    <div style={page}>
      <header style={header}>
        <div style={{ fontWeight: 800 }}>FocusFlow</div>
        <div style={{ marginLeft: "auto" }}>
          <ProfileMenu />
        </div>
      </header>

      <main style={main}>
        <div style={content}>
          <section style={timerCol}>
            <Timer
              selectedTaskId={selectedTask?._id || null}
              selectedTaskTitle={selectedTask?.title || null}
            />
          </section>

          <aside style={asideCol}>
            <div style={asideHead}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Your tasks</h3>
              <button
                style={goBtn}
                onClick={() => navigate("/tasks")}
              >
                Open Tasks →
              </button>
            </div>

            <DuePanel
              onSelectTask={setSelectedTask}
              selectedTaskId={selectedTask?._id || null}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Styles ---------------- */
const page = { minHeight: "100vh", display: "flex", flexDirection: "column" };
const header = { display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" };
const main = { flex: 1, display: "grid", placeItems: "center", padding: 24, width: "100%" };
const content = {
  width: "min(1100px, 95vw)",
  display: "grid",
  gridTemplateColumns: "1fr 320px",  // timer left, tasks panel right
  gap: 16
};
const timerCol = { borderRadius: 14, padding: 16, display: "grid", placeItems: "center" };
const asideCol = {
  borderRadius: 14,
  padding: 12,
  minHeight: 220,
  background: "rgba(0,0,0,.35)",
  backdropFilter: "blur(6px)"
};
const asideHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8
};
const goBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #2a2a2a",
  background: "#2563eb",
  color: "#fff",
  fontSize: 12,
  cursor: "pointer"
};
