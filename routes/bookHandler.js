// routes/bookHandler.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

// GET /api/books - Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().sort({ addedDate: -1 });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/books/:id - Get book by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid book ID format. Must be a 24-character hexadecimal string.'
    });
  }

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/books - Create a new book
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('isbn').optional().trim().isISBN().withMessage('Invalid ISBN format'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  async (req, res) => {
    try {
      const bookData = { ...req.body };
      delete bookData._id;
      delete bookData.addedDate;
      delete bookData.createdAt;
      delete bookData.updatedAt;
      delete bookData.__v;

      const book = new Book(bookData);
      await book.save();
      res.status(201).json(book);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          message: 'Duplicate ISBN',
          error: 'A book with this ISBN already exists',
          field: 'isbn',
          value: err.keyValue?.isbn || 'unknown'
        });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: err.errors 
        });
      }
      res.status(500).json({ 
        message: 'Server error', 
        error: err.message 
      });
    }
  }
);

// PUT /api/books/:id - Update book
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
      const book = await Book.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      res.status(200).json(book);
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: err.errors });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// DELETE /api/books/:id - Delete book
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid book ID format' });
  }

  try {
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;