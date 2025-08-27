// server/routes/tasks.js
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const router = express.Router();

/* ---------------- Models ---------------- */
const TaskSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  title:       { type: String, required: true, trim: true },
  status:      { type: String, enum: ['todo', 'doing', 'done'], default: 'todo', index: true },
  priority:    { type: String, enum: ['low', 'med', 'high'], default: 'med' },
  due:         { type: Date, default: null },
  estimatePoms:{ type: Number, default: 0 },   // user estimate
  actualPoms:  { type: Number, default: 0 },   // increments from /api/sessions
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

/* --------------- Auth middleware --------------- */
function auth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = payload; // { userId }
    next();
  });
}

/* ---------------- Helpers ---------------- */
function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/* ---------------- Routes ---------------- */

// GET /api/tasks  -> list for current user
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.userId })
    // sort: active first, then due soonest, then newest
    .sort({ 
      status: 1,                               // 'done' naturally sorts after 'doing'/'todo'
      due: 1, 
      createdAt: -1 
    })
    .lean();
  res.json({ tasks });
});

// POST /api/tasks  -> create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, priority = 'med', due = null, estimatePoms = 0 } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });

    const t = await Task.create({
      userId: req.user.userId,
      title: title.trim(),
      priority,
      due: parseDateOrNull(due),
      estimatePoms: Number(estimatePoms) || 0,
    });

    res.status(201).json({ task: t });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id  -> update allowed fields
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  const allowed = {};
  const { title, status, priority, due, estimatePoms, actualPoms } = req.body || {};

  if (title != null)        allowed.title = String(title).trim();
  if (status != null)       allowed.status = status;         // trust enum; Mongoose validates
  if (priority != null)     allowed.priority = priority;     // enum too
  if (due !== undefined)    allowed.due = parseDateOrNull(due);
  if (estimatePoms != null) allowed.estimatePoms = Math.max(0, parseInt(estimatePoms, 10) || 0);
  if (actualPoms != null)   allowed.actualPoms = Math.max(0, parseInt(actualPoms, 10) || 0);

  const task = await Task.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { $set: allowed },
    { new: true, runValidators: true }
  );

  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  const deleted = await Task.findOneAndDelete({ _id: id, userId: req.user.userId });
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
});

module.exports = router;
