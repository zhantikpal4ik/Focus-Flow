// src/App.jsx
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Protected from './Protected';
import Auth from './auth';
import PomodoroPage from './pages/Pomodoro';
import Stats from './pages/Stats'; // ⬅️ add Stats page

import Profile from "./pages/Profile";
import TasksPage from "./pages/Tasks";
import HomePage from "./pages/Home";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* send root to timer */}
        <Route path="/" element={<HomePage />} />

        <Route path="/welcome" element={<HomePage />} />    {/* Optional alias */}
        {/* public auth */}
        <Route path="/auth" element={<Auth />} />

        <Route 
          path="/tasks" 
          element={
            <Protected>
              <TasksPage />
            </Protected>
          }
          />
       
        {/* app pages */}
        <Route
          path="/timer"
          element={
            <Protected>
              <PomodoroPage />
            </Protected>
          }
        />
        <Route
          path="/stats"
          element={
            <Protected>
              <Stats />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        {/* <Route path="/tasks" element={<Protected><Tasks/></Protected>} /> */}

        {/* fallback */}
        <Route path="*" element={<Navigate to="/timer" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
function Home() {
  const token = localStorage.getItem('token');
  return (
    <div style={{ padding: 20 }}>
      <h2>FocusFlow</h2>
      <p>Auth status: {token ? '✅ Logged in' : '❌ Not logged in'}</p>
      <p>Use the links below to navigate.</p>
      <nav style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <Link to="/">Timer</Link>
        <Link to="/stats">Stats</Link>
        <Link to="/auth">{token ? 'Account' : 'Login / Register'}</Link>
      </nav>
    </div>
  );
}

