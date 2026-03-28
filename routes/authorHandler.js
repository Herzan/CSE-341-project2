// authorHandler.js - Single file: routes + controller + validation + Swagger docs for Authors

const express = require('express');
const router = express.Router();
const Author = require('../models/Author');
const { body, validationResult } = require('express-validator');
const { isAuthenticated } = require('../middleware/auth');   // ← Added for protection

// ────────────────────────────────────────────────
// GET /api/authors - Get all authors (Public)
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors:
 *   get:
 *     summary: Get all authors
 *     responses:
 *       200:
 *         description: Array of authors
 */
router.get('/', async (req, res) => {
  try {
    const authors = await Author.find().sort({ addedDate: -1 });
    res.status(200).json(authors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ────────────────────────────────────────────────
// GET /api/authors/:id - Get one author (Public)
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors/{id}:
 *   get:
 *     summary: Get author by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Author object
 *       404:
 *         description: Not found
 */
router.get('/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.status(200).json(author);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ────────────────────────────────────────────────
// POST /api/authors - Create author (PROTECTED)
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors:
 *   post:
 *     summary: Create a new author
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               bio: { type: string }
 *               nationality: { type: string }
 *               birthYear: { type: integer }
 *               website: { type: string }
 *               photoUrl: { type: string }
 *     responses:
 *       201:
 *         description: Author created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Please log in with Google
 */
router.post(
  '/',
  isAuthenticated,   // ← Protected
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('birthYear').optional().isInt({ min: 1500, max: 2026 }).withMessage('Invalid birth year'),
    body('website').optional().matches(/^https?:\/\//).withMessage('Website must start with http(s)://'),
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
      const author = new Author(req.body);
      await author.save();
      res.status(201).json(author);
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: err.errors });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ────────────────────────────────────────────────
// PUT /api/authors/:id - Update author (PROTECTED)
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors/{id}:
 *   put:
 *     summary: Update author
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated author
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.put(
  '/:id',
  isAuthenticated,   // ← Protected
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('birthYear').optional().isInt({ min: 1500, max: 2026 }),
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
      const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!author) return res.status(404).json({ message: 'Author not found' });
      res.status(200).json(author);
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: err.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ────────────────────────────────────────────────
// DELETE /api/authors/:id - Delete author (PROTECTED)
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors/{id}:
 *   delete:
 *     summary: Delete author
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.delete(
  '/:id',
  isAuthenticated,   // ← Protected
  async (req, res) => {
    try {
      const author = await Author.findByIdAndDelete(req.params.id);
      if (!author) return res.status(404).json({ message: 'Author not found' });
      res.status(200).json({ message: 'Author deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;