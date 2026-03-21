const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  bio: { type: String, maxlength: 1000 },
  nationality: { type: String },
  birthYear: { type: Number, min: 1500, max: new Date().getFullYear() },
  website: { type: String, match: /^https?:\/\// },
  photoUrl: { type: String },
  addedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Author', authorSchema);