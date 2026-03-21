// authorHandler.js - Single file: routes + controller + validation + Swagger docs for Authors

const express = require('express');
const router = express.Router();
const Author = require('../models/Author');// adjust path if models/ folder
const { body, validationResult } = require('express-validator');

// ────────────────────────────────────────────────
// GET /api/authors - Get all authors
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
// GET /api/authors/:id - Get one author
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
// POST /api/authors - Create author
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors:
 *   post:
 *     summary: Create a new author
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
 */
router.post(
  '/',
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
// PUT /api/authors/:id - Update author
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors/{id}:
 *   put:
 *     summary: Update author
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
 *       404:
 *         description: Not found
 */
router.put(
  '/:id',
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
// DELETE /api/authors/:id - Delete author
// ────────────────────────────────────────────────
/**
 * @swagger
 * /api/authors/{id}:
 *   delete:
 *     summary: Delete author
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.status(200).json({ message: 'Author deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
