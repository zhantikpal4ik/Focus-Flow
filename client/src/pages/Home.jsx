// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={wrap}>
      <header style={topbar}>
        <div style={brand}>FocusFlow</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={ghost} onClick={() => navigate("/auth")}>Log in</button>
          <button style={primary} onClick={() => navigate("/auth")}>Get started</button>
        </div>
      </header>

      {/* HERO */}
      <section style={hero}>
        <div style={heroCol}>
          <h1 style={h1}>Be deliberate about your time.</h1>
          <p style={lead}>
            FocusFlow combines a focused Pomodoro timer, a lightweight task manager,
            and gentle streak tracking—so you can work with intention and actually
            see your progress.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={{ ...primary, padding: "12px 18px", fontSize: 16 }} onClick={() => navigate("/auth")}>
              Create a free account
            </button>
            <button style={{ ...ghost, padding: "12px 18px", fontSize: 16 }} onClick={() => navigate("/pomodoro")}>
              Try the timer →
            </button>
          </div>

          <ul style={ticks}>
            <li>⚡ Minimal & fast</li>
            <li>📊 Clear stats & streaks</li>
            <li>📝 Simple to-dos with due dates</li>
            <li>🎧 Ambient themes & sounds</li>
          </ul>
        </div>

        <div style={heroArt}>
          <RingIllustration />
        </div>
      </section>

      {/* FEATURES */}
      <section style={section}>
        <h2 style={h2}>Everything you need to stay in flow</h2>
        <div style={grid4}>
          <FeatureCard
            title="Focused Pomodoro"
            desc="Work in intentional blocks with auto breaks and gentle alarms."
            icon={<ClockIcon />}
          />
          <FeatureCard
            title="Streaks & Stats"
            desc="See your momentum at a glance. Celebrate consistency, not just output."
            icon={<StreakIcon />}
          />
          <FeatureCard
            title="Tasks that fit"
            desc="Capture to-dos with priorities and due dates; pick one to focus on."
            icon={<ChecklistIcon />}
          />
          <FeatureCard
            title="Themes & Sounds"
            desc="Dark, café, forest… choose your vibe. Keep it calm and readable."
            icon={<ThemeIcon />}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={section}>
        <h2 style={h2}>How it works</h2>
        <ol style={steps}>
          <li>
            <span style={num}>1</span>
            <div>
              <div style={stepTitle}>Plan one thing</div>
              <div style={muted}>Pick a task in the side panel (or add one on the Tasks page).</div>
            </div>
          </li>
          <li>
            <span style={num}>2</span>
            <div>
              <div style={stepTitle}>Start a Pomodoro</div>
              <div style={muted}>Work with focus. We’ll log your session and keep your streak alive.</div>
            </div>
          </li>
          <li>
            <span style={num}>3</span>
            <div>
              <div style={stepTitle}>Review & adjust</div>
              <div style={muted}>Check your stats, refine tasks, and repeat. Tiny wins add up.</div>
            </div>
          </li>
        </ol>
      </section>

      {/* CTA */}
      <section style={{ ...section, textAlign: "center" }}>
        <div style={ctaCard}>
          <h3 style={{ margin: 0, fontSize: 24 }}>Ready to focus with intention?</h3>
          <p style={{ ...muted, margin: "8px 0 16px" }}>
            Join free and start your first Pomodoro in seconds.
          </p>
          <button style={{ ...primary, padding: "12px 18px", fontSize: 16 }} onClick={() => navigate("/auth")}>
            Get started
          </button>
        </div>
      </section>

      <footer style={footer}>
        <div>© {new Date().getFullYear()} FocusFlow</div>
        <div style={{ opacity: .7 }}>Built for humans who like finishing things.</div>
      </footer>
    </div>
  );
}

/* ---------------- Components ---------------- */

function FeatureCard({ title, desc, icon }) {
  return (
    <div style={card}>
      <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={muted}>{desc}</div>
    </div>
  );
}

/* Simple inline illustrations/icons (no assets needed) */
function RingIllustration() {
  return (
    <svg width="360" height="360" viewBox="0 0 360 360" role="img" aria-label="Abstract rings">
      <defs>
        <radialGradient id="g1" cx="50%" cy="45%" r="60%">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.20" />
          <stop offset="50%" stopColor="#8ab4ff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#1f2937" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="180" cy="180" r="120" fill="url(#g1)" />
      <circle cx="180" cy="180" r="170" stroke="#334155" strokeOpacity="0.4" strokeWidth="2" fill="none" />
      <circle cx="180" cy="180" r="85"  stroke="#475569" strokeOpacity="0.35" strokeWidth="2" fill="none" />
      <circle cx="180" cy="180" r="45"  stroke="#64748b" strokeOpacity="0.25" strokeWidth="2" fill="none" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#93c5fd" strokeWidth="2"/>
      <path d="M12 7v5l3 2" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function StreakIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path d="M4 14c2-1 4-3 6-3s4 2 6 3 4 1 4 1" stroke="#fca5a5" strokeWidth="2" fill="none"/>
      <circle cx="6" cy="14" r="1.5" fill="#fca5a5"/>
      <circle cx="12" cy="11" r="1.5" fill="#fca5a5"/>
      <circle cx="18" cy="14" r="1.5" fill="#fca5a5"/>
    </svg>
  );
}
function ChecklistIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="#a7f3d0" strokeWidth="2"/>
      <path d="M8 9h6M8 13h8" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 9l-1 1 2 2 3-3" stroke="#34d399" strokeWidth="2" fill="none"/>
    </svg>
  );
}
function ThemeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 1 0 9 9c0-2.5-1.2-4.8-3-6.3A5 5 0 0 1 12 3z" stroke="#c4b5fd" strokeWidth="2"/>
      <circle cx="9" cy="10" r="1" fill="#c4b5fd"/>
      <circle cx="14" cy="14" r="1" fill="#c4b5fd"/>
      <circle cx="11" cy="16" r="1" fill="#c4b5fd"/>
    </svg>
  );
}

/* ---------------- Styles ---------------- */

const wrap = {
  minHeight: "100vh",
  background: "radial-gradient(1200px 600px at 20% -20%, rgba(56,189,248,.06), transparent), #0b0e14",
  color: "#e5e7eb",
  display: "flex",
  flexDirection: "column"
};
const topbar = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "16px 22px"
};
const brand = { fontWeight: 800, letterSpacing: .3, fontSize: 18 };
const primary = {
  padding: "8px 12px", borderRadius: 10, border: "none",
  background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 700,
  boxShadow: "0 10px 24px rgba(37,99,235,.28)"
};
const ghost = {
  padding: "8px 12px", borderRadius: 10, border: "1px solid #2a2a2a",
  background: "transparent", color: "#e5e7eb", cursor: "pointer"
};

const hero = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1fr",
  gap: 24,
  width: "min(1100px, 95vw)",
  margin: "24px auto 10px",
  alignItems: "center"
};
const heroCol = { paddingRight: 8 };
const h1 = { margin: "6px 0 8px", fontSize: 42, lineHeight: 1.05, fontWeight: 900 };
const lead = { fontSize: 18, opacity: .85, marginBottom: 16 };
const ticks = { margin: "14px 0 0", paddingLeft: 18, display: "grid", gap: 6, opacity: .9 };

const heroArt = {
  justifySelf: "center",
  alignSelf: "center",
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 16,
  padding: 16,
  backdropFilter: "blur(6px)"
};

const section = {
  width: "min(1100px, 95vw)",
  margin: "34px auto 10px"
};
const h2 = { margin: "0 0 14px", fontSize: 24, fontWeight: 800 };
const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0,1fr))",
  gap: 12
};
const card = {
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,255,255,.035)",
  border: "1px solid rgba(255,255,255,.08)"
};
const steps = { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 };
const num = {
  width: 28, height: 28, borderRadius: 999, display: "inline-grid", placeItems: "center",
  background: "rgba(37,99,235,.22)", border: "1px solid rgba(37,99,235,.35)", color: "#c7d2fe",
  marginRight: 10, fontWeight: 800
};
const stepTitle = { fontWeight: 700, marginBottom: 2 };
const muted = { opacity: .8 };

const ctaCard = {
  display: "inline-block",
  padding: "18px 20px",
  borderRadius: 16,
  background: "rgba(255,255,255,.035)",
  border: "1px solid rgba(255,255,255,.08)"
};

const footer = {
  width: "min(1100px, 95vw)",
  margin: "40px auto 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  opacity: .8
};
