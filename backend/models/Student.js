const mongoose = require('mongoose');

/* ── Sub-schemas ── */
const sessionSchema = new mongoose.Schema({
  date:          { type: Date, default: Date.now },
  taskId:        { type: String, required: true },
  focusSeconds:  { type: Number, default: 0 },
  totalSeconds:  { type: Number, default: 0 },
  tabSwitches:   { type: Number, default: 0 },
  correctStreak: { type: Number, default: 0 },
  hintsUsed:     { type: Number, default: 0 },
  selfRating:    { type: Number, min: 1, max: 5 },
  outcome:       { type: String, enum: ['solved', 'failed', 'abandoned'], default: 'solved' },
  attempts:      { type: Number, default: 1 }
}, { _id: false });

/* ── Main schema ── */
const studentSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, lowercase: true, trim: true },
  role:        { type: String, enum: ['student', 'teacher'], default: 'student' },
  class:       { type: String, default: '' },
  passwordHash:{ type: String, required: true },
  sessions:    [sessionSchema],
  createdAt:   { type: Date, default: Date.now }
}, { timestamps: true });

/* ── Virtuals ── */
studentSchema.virtual('sessionCount').get(function () {
  return this.sessions.length;
});

/* ── Methods ── */
studentSchema.methods.recentSessions = function (n = 7) {
  return this.sessions.slice(-n);
};

/* ── Statics ── */
studentSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase() });
};

module.exports = mongoose.model('Student', studentSchema);
