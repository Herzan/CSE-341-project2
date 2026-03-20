const Book = require('../models/Book');

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ addedDate: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};