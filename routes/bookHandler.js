// routes/bookHandler.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');           // ← correct path to models/Book.js
const mongoose = require('mongoose');             // ← for isValidObjectId
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     responses:
 *       200:
 *         description: Array of books
 */
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().sort({ addedDate: -1 });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the book (24 hexadecimal characters)
 *     responses:
 *       200:
 *         description: Book object
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Check if it's a valid ObjectId format
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

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author]
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               isbn: { type: string }
 *               genre: { type: string, enum: ["Fiction", "Non-Fiction", "Sci-Fi", "Fantasy", "Mystery", "Biography", "Other"] }
 *               publicationYear: { type: integer }
 *               pageCount: { type: integer }
 *               description: { type: string }
 *               coverImageUrl: { type: string }
 *               rating: { type: number }
 *               isRead: { type: boolean }
 *               userNotes: { type: string }
 *     responses:
 *       201:
 *         description: Created book
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate ISBN
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    // Optional: add more field validations
    body('isbn').optional().trim().isISBN().withMessage('Invalid ISBN format'),
    // You can add more here later, e.g.:
    // body('publicationYear').optional().isInt({ min: 1000, max: new Date().getFullYear() + 1 }),
    // body('genre').optional().isIn(['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'Biography', 'Other']),
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
      // Remove client-provided _id / timestamps (safety)
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
      if (err.code === 11000) { // MongoDB duplicate key error (e.g. unique ISBN)
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

module.exports = router;