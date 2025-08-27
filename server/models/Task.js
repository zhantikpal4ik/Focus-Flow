const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  title:      { type: String, required: true, trim: true },
  notes:      { type: String, default: '' },
  due:        { type: Date, default: null },
  estPoms:    { type: Number, default: 0 },   // estimated pomodoros
  actualPoms: { type: Number, default: 0 },   // increment when a work block finishes
  priority:   { type: Number, default: 0 },   // 0=none, 1=low, 2=med, 3=high
  done:       { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
