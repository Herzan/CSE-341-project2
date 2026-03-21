const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/authors:
 *   get:
 *     summary: Get all authors
 *     responses:
 *       200:
 *         description: Array of authors
 */
router.get('/', authorController.getAllAuthors);

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
router.get('/:id', authorController.getAuthorById);

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
    body('birthYear').optional().isInt({ min: 1500, max: 2026 }),
    // Add more if needed
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authorController.createAuthor
);

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
    body('name').optional().trim().notEmpty(),
    body('birthYear').optional().isInt({ min: 1500, max: 2026 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authorController.updateAuthor
);

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
router.delete('/:id', authorController.deleteAuthor);

module.exports = router;