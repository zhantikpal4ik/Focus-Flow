import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./services/api";

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleLogin() {
    setErr(""); setBusy(true);
    try {
      const { token } = await api("/api/login", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem("token", token);
      navigate("/timer");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    setErr(""); setBusy(true);
    try {
      await api("/api/register", {
        method: "POST",
        body: { email, password },
      });
      // auto login
      await handleLogin();
    } catch (e) {
      setErr(e.message || "Registration failed");
      setBusy(false);
    }
  }

  const onSubmit = (e) => {
    e.preventDefault();
    tab === "login" ? handleLogin() : handleRegister();
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={tabs}>
          <button
            onClick={() => setTab("login")}
            style={tabBtn(tab === "login")}
          >
            Login
          </button>
          <button
            onClick={() => setTab("register")}
            style={tabBtn(tab === "register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            style={input}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            style={input}
          />

          {err && <div style={error}>{err}</div>}

          <button type="submit" disabled={busy} style={cta}>
            {busy ? "Please wait..." : tab === "login" ? "Login" : "Create account"}
          </button>

          <button type="button" onClick={()=>navigate("/")} style={linkBtn}>
            ← Back to home
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
const wrap = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "linear-gradient(180deg,#0f1725,#0b1220)", // deep navy/black gradient
  color: "#e5e7eb", // light text
};



const card = {
  width: "min(460px, 92vw)",
  background: "rgba(30, 30, 40, 0.95)", // translucent dark
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 25px 60px rgba(0,0,0,.5)",
  color: "#f5f5f5",
};


const tabs = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  marginBottom: 14,
};

const tabBtn = (active) => ({
  padding: "10px 12px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  background: active ? "#2563eb" : "#eef2ff",
  color: active ? "#fff" : "#3b3f59",
  fontWeight: 700,
});

const input = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#272a33",
  color: "#fff",
  outline: "none",
};

const cta = {
  marginTop: 4,
  padding: "12px 14px",
  borderRadius: 12,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const linkBtn = {
  marginTop: 2,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
};

const error = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 14,
};
