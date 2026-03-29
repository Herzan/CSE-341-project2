const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, unique: true, sparse: true },   // Changed from googleId
  displayName: { type: String },
  email: { type: String },
  photo: { type: String },
  provider: { type: String, default: 'github' },
  addedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);