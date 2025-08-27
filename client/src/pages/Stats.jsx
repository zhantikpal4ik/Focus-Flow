// src/pages/Stats.jsx
import { useEffect, useMemo, useState } from 'react';

export default function Stats() {
  const [rows, setRows] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setLoading(true);
      setErr('');
      const token = localStorage.getItem('token');

      const [sumRes, meRes] = await Promise.all([
        fetch('http://localhost:3000/api/sessions/summary?days=14', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const sumData = await sumRes.json();
      const meData = await meRes.json();

      if (!sumRes.ok) throw new Error(sumData.error || 'Failed to load summary');
      if (!meRes.ok) throw new Error(meData.error || 'Failed to load profile');

      setRows(sumData.rows || []);
      setMe(meData || {});
    } catch (e) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // also refresh if a session completes (Timer dispatches "streak-updated")
  useEffect(() => {
    const h = () => load();
    window.addEventListener('streak-updated', h);
    return () => window.removeEventListener('streak-updated', h);
  }, []);

  const totals = useMemo(() => {
    const minutes = rows.reduce((sum, r) => sum + (r.workMinutes || 0), 0);
    const sessions = rows.reduce((sum, r) => sum + (r.sessions || 0), 0);
    const hours = Math.round((minutes / 60) * 10) / 10;
    return { minutes, hours, sessions };
  }, [rows]);

  return (
    <div style={wrap}>
      <header style={header}>
        <h2 style={{ margin: 0 }}>Your stats (last 14 days)</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={btn}>Refresh</button>
        </div>
      </header>

      {loading && <div style={{ opacity: .8 }}>Loading…</div>}
      {err && <div style={{ color: 'tomato' }}>Error: {err}</div>}

      {!loading && !err && (
        <>
          {/* Streak card */}
          <section style={streakRow}>
            <div style={streakCard}>
              <div style={{ fontSize: 20 }}>🔥</div>
              <div>
                <div style={{ fontWeight: 700 }}>Current streak</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {me?.streak?.current ?? 0} days
                </div>
                <div style={{ opacity: .8, fontSize: 12 }}>
                  Best: {me?.streak?.best ?? 0} • Last: {me?.streak?.lastActiveDay ?? '—'}
                </div>
              </div>
            </div>
          </section>

          {/* Empty state */}
          {rows.length === 0 ? (
            <div style={{ opacity: .8 }}>No data yet — finish a Pomodoro to see stats.</div>
          ) : (
            <>
              {/* Totals */}
              <section style={cards}>
                <StatCard label="Total work (min)" value={totals.minutes} />
                <StatCard label="Total work (hrs)" value={totals.hours} />
                <StatCard label="Sessions" value={totals.sessions} />
              </section>

              {/* Per-day table */}
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Day</th>
                    <th style={th}>Work Minutes</th>
                    <th style={th}>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.day}>
                      <td style={td}>{r.day}</td>
                      <td style={td}>{r.workMinutes}</td>
                      <td style={td}>{r.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, opacity: .8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

/* styles */
const wrap = { maxWidth: 900, margin: '40px auto', padding: '0 16px', color: '#fff' };
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 };
const btn = { padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: '#222', color: '#fff', cursor: 'pointer' };

const streakRow = { marginBottom: 16 };
const streakCard = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  border: '1px solid #333',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(255,255,255,.04)',
  maxWidth: 420,
};

const cards = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, marginBottom: 16 };
const card = { border: '1px solid #333', borderRadius: 12, padding: 16, background: 'rgba(255,255,255,.04)' };

const table = { width: '100%', borderCollapse: 'collapse', border: '1px solid #333', borderRadius: 12, overflow: 'hidden' };
const th = { textAlign: 'left', borderBottom: '1px solid #333', padding: '10px 8px', background: 'rgba(255,255,255,.04)' };
const td = { borderBottom: '1px solid #222', padding: '10px 8px' };
