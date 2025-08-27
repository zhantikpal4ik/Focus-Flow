// server/server.js
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');

const app = express();

/* ----------------------------- Middleware ----------------------------- */
app.use(cors({
  origin: 'http://localhost:5173',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

/* ------------------------- Database Connection ------------------------ */
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pomodoro')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

/* ------------------------------ Schemas ------------------------------- */
const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },

  pomodoroSettings: {
    workTime:   { type: Number, default: 25 },
    shortBreak: { type: Number, default: 5  },
    longBreak:  { type: Number, default: 15 }
  },

  uiSettings: {
    themeKey:  { type: String,  default: 'dark' },
    alarmKey:  { type: String,  default: 'ding' },
    autoLoop:  { type: Boolean, default: false },
    longEvery: { type: Number,  default: 4 }
  },

  streak: {
    current:       { type: Number, default: 0 },
    best:          { type: Number, default: 0 },
    lastActiveDay: { type: String, default: null } // 'YYYY-MM-DD' UTC
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const sessionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  duration:    { type: Number, required: true }, // seconds
  mode:        { type: String, enum: ['work','shortBreak','longBreak'], required: true },
  taskId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  completedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);

/* ------------------------------ Helpers ------------------------------- */
function validatePassword(password) {
  const minLength = 8;
  const hasUpper  = /[A-Z]/.test(password);
  const hasNum    = /[0-9]/.test(password);
  const hasSpec   = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  return password.length >= minLength && hasUpper && hasNum && hasSpec;
}

function dayKeyUTC(d = new Date()) {
  return new Date(d).toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function isYesterday(todayKey, lastKey) {
  const A = new Date(`${todayKey}T00:00:00Z`);
  const B = new Date(`${lastKey}T00:00:00Z`);
  return (A - B) / 86400000 === 1;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.warn('JWT verify failed:', err.name, err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = payload; // { userId, iat, exp }
    next();
  });
}

/* -------------------------------- Auth -------------------------------- */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!validatePassword(password)) return res.status(400).json({ error: 'Password does not meet requirements' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });
    res.json({ success: true, userId: user._id, settings: user.pomodoroSettings });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

/* --------------------------- Settings (GET/POST) --------------------------- */
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ settings: user.pomodoroSettings, ui: user.uiSettings });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { pomodoroSettings, ui } = req.body || {};
    const update = {};

    // Validate & set durations
    if (pomodoroSettings) {
      const { workTime, shortBreak, longBreak } = pomodoroSettings;
      const isValid = (n) => Number.isFinite(n) && n >= 1 && n <= 600; // 1..600 minutes

      if (workTime != null)   { if (!isValid(workTime))   return res.status(400).json({ error: 'Invalid workTime'   });   update['pomodoroSettings.workTime']   = Math.floor(workTime); }
      if (shortBreak != null) { if (!isValid(shortBreak)) return res.status(400).json({ error: 'Invalid shortBreak' }); update['pomodoroSettings.shortBreak'] = Math.floor(shortBreak); }
      if (longBreak != null)  { if (!isValid(longBreak))  return res.status(400).json({ error: 'Invalid longBreak'  });  update['pomodoroSettings.longBreak']  = Math.floor(longBreak); }
    }

    // Validate & set UI
    if (ui) {
      const { themeKey, alarmKey, autoLoop, longEvery } = ui;
      if (themeKey != null) update['uiSettings.themeKey'] = String(themeKey);
      if (alarmKey != null) update['uiSettings.alarmKey'] = String(alarmKey);
      if (typeof autoLoop === 'boolean') update['uiSettings.autoLoop'] = autoLoop;
      if (longEvery != null) {
        const n = Math.max(2, Math.min(12, parseInt(longEvery, 10) || 4));
        update['uiSettings.longEvery'] = n;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, settings: user.pomodoroSettings, ui: user.uiSettings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

/* --------------------------- Sessions & Streaks --------------------------- */
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { duration, mode, completedAt, taskId = null } = req.body || {};
    if (!duration || !mode) return res.status(400).json({ error: 'duration and mode required' });

    const session = await Session.create({
      userId: req.user.userId,
      duration, // seconds
      mode,     // 'work' | 'shortBreak' | 'longBreak'
      taskId,
      completedAt: completedAt ? new Date(completedAt) : new Date()
    });

    // Count toward streak only WORK sessions of >= 10 min
    if (mode === 'work' && duration >= 10 * 60) {
      const user = await User.findById(req.user.userId);

      // Initialize streak if missing (for legacy users)
      if (!user.streak) {
        user.streak = { current: 0, best: 0, lastActiveDay: null };
      }

      const today = dayKeyUTC(new Date());
      const last  = user.streak.lastActiveDay;

      if (last === today) {
        // already counted today
      } else if (last && isYesterday(today, last)) {
        user.streak.current = (user.streak.current || 0) + 1;
        user.streak.best = Math.max(user.streak.best || 0, user.streak.current);
        user.streak.lastActiveDay = today;
      } else {
        user.streak.current = 1;
        user.streak.best = Math.max(user.streak.best || 0, 1);
        user.streak.lastActiveDay = today;
      }
      await user.save();

      // (optional) If you have tasks with actualPoms, increment here
      if (taskId) {
        try {
          const Task = require('./models/Task');
          await Task.updateOne(
            { _id: taskId, userId: req.user.userId },
            { $inc: { actualPoms: 1 } }
          );
        } catch (e) {
          console.warn('Task increment failed:', e.message);
        }
      }
    }

    res.status(201).json({ session });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// /api/sessions/summary?days=14  (default 7, max 90)
app.get('/api/sessions/summary', authenticateToken, async (req, res) => {
  try {
    const days  = Math.min(parseInt(req.query.days || '7', 10), 90);
    const since = new Date(Date.now() - days * 86400000);

    const rows = await Session.aggregate([
      { $match: {
          userId: new mongoose.Types.ObjectId(req.user.userId),
          completedAt: { $gte: since },
          mode: 'work'
        }
      },
      { $addFields: { day: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } } } },
      { $group: {
          _id: "$day",
          workMinutes: { $sum: { $divide: ["$duration", 60] } },
          sessions:    { $sum: 1 }
        }
      },
      { $project: { _id: 0, day: "$_id", workMinutes: { $round: ["$workMinutes", 0] }, sessions: 1 } },
      { $sort: { day: 1 } }
    ]);

    res.json({ days, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

/* --------------------------------- Me --------------------------------- */
app.get('/api/me', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.userId)
    .select('email createdAt uiSettings pomodoroSettings streak')
    .lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    email: user.email,
    createdAt: user.createdAt,
    settings: user.pomodoroSettings,
    ui: user.uiSettings,
    streak: user.streak || { current: 0, best: 0, lastActiveDay: null }
  });
});

/* ------------------------------ Task Routes ---------------------------- */
// Mount AFTER middleware and define auth on it.
// Ensure you have server/routes/tasks.js exporting an Express router.
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', authenticateToken, taskRoutes);

/* ------------------------------- Startup ------------------------------- */
const PORT = process.env.PORT || 3000;

// DEV helpers
app.post('/api/debug/save', authenticateToken, async (req, res) => {
  const s = await Session.create({
    userId: req.user.userId,
    duration: 60, // 1 min
    mode: 'work',
    completedAt: new Date()
  });
  res.json({ ok: true, id: s._id });
});

app.get('/api/ping', authenticateToken, (req, res) => {
  res.json({ ok: true, userId: req.user.userId });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
