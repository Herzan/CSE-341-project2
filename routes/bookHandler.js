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

// Add POST, GET/:id, PUT/:id, DELETE/:id similarly when ready
// Example minimal POST:
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
    body('title').trim().notEmpty(),
    body('author').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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