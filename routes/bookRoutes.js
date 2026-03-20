const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.post('/', bookController.createBook);

router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

const { body, validationResult } = require('express-validator');

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('publicationYear').optional().isInt({ min: 1000, max: 2100 }),
  // add more...
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}, bookController.createBook);


module.exports = router;