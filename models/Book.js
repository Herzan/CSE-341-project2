const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true, sparse: true },
  genre: { type: String, enum: ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'Biography', 'Other'] },
  publicationYear: { type: Number, min: 1000, max: new Date().getFullYear() + 1 },
  pageCount: { type: Number, min: 1 },
  description: { type: String, maxlength: 1000 },
  coverImageUrl: { type: String },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  isRead: { type: Boolean, default: false },
  userNotes: { type: String },
  addedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);