// src/components/ProfileMenu.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(null); // { email, streak: {current,best,...}, ... }
  const boxRef = useRef(null);

  async function loadMe() {
    const token = localStorage.getItem("token");
    if (!token) { setMe(null); return; }
    try {
      const res = await fetch("http://localhost:3000/api/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMe(data);
      else setMe(null);
    } catch {
      setMe(null);
    }
  }

  // initial load + listen for streak updates from Timer.jsx
  useEffect(() => {
    loadMe();
    const onChange = () => loadMe();
    window.addEventListener("streak-changed", onChange);
    return () => window.removeEventListener("streak-changed", onChange);
  }, []);

  // close on outside click or Esc
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function logout() {
    localStorage.removeItem("token");
    setOpen(false);
    navigate("/"); // go back to landing
  }

  // Not logged in → show Login button
  if (!localStorage.getItem("token")) {
    return (
      <button onClick={() => navigate("/auth")} style={loginBtn}>
        Login
      </button>
    );
  }

  const current = me?.streak?.current ?? 0;
  const best = me?.streak?.best ?? 0;

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={avatarBtn}
        title="Account"
      >
        <AvatarIcon />
        {/* streak badge */}
        <span style={badge}>{current}</span>
      </button>

      {open && (
        <div role="menu" style={menu}>
          <div style={menuHead}>
            <div style={{ fontSize: 12, color: "#9aa0a6" }}>Streak</div>
            <div><b>{current}</b> day{current === 1 ? "" : "s"} (best {best})</div>
          </div>
          <button role="menuitem" onClick={() => { setOpen(false); navigate("/stats"); }} style={item}>
            📊 Stats
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); navigate("/profile"); }} style={item}>
            👤 Profile
          </button>
          <div style={{ height: 1, background: "#2a2a2a", margin: "4px 0" }} />
          <button role="menuitem" onClick={logout} style={{ ...item, color: "#f87171" }}>
            ⎋ Logout
          </button>
        </div>
      )}
    </div>
  );
}

/* -------- styles -------- */
const avatarBtn = {
  position: "relative",
  width: 36,
  height: 36,
  borderRadius: "999px",
  border: "1px solid #2f2f2f",
  background: "#1a1a1a",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const badge = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 20,
  height: 20,
  padding: "0 6px",
  borderRadius: 999,
  fontSize: 12,
  lineHeight: "20px",
  background: "#ef4444", // orange/red
  color: "#fff",
  border: "1px solid rgba(255,255,255,.25)",
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(239,68,68,.4)",
};

const menu = {
  position: "absolute",
  top: "44px",
  right: 0,
  width: 220,
  background: "#1c1c1c",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  boxShadow: "0 12px 40px rgba(0,0,0,.35)",
  padding: 6,
  zIndex: 1000,
};

const menuHead = { padding: "8px 10px", borderRadius: 10, background: "#151515", marginBottom: 4 };

const item = {
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  color: "#e5e7eb",
  borderRadius: 8,
  cursor: "pointer",
};

const loginBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#e5e7eb",
  cursor: "pointer",
};

function AvatarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 12c2.761 0 5-2.582 5-5.5S14.761 1 12 1 7 3.582 7 6.5 9.239 12 12 12zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
    </svg>
  );
}
