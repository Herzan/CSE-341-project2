// routes/bookHandler.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');           // ← correct path to models/Book.js
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
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error (e.g. invalid ID format)
 */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
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
 *     responses:
 *       201:
 *         description: Created book
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
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
      const book = new Book(req.body);
      await book.save();
      res.status(201).json(book);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

module.exports = router;