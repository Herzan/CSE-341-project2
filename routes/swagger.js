const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json'); // static file

// Serve Swagger UI at /api-docs
router.use('/', swaggerUi.serve);

// Root of /api-docs shows the UI with our static swagger.json
router.get('/', swaggerUi.setup(swaggerDocument, {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    tryItOutEnabled: true
  }
}));

// Bonus: serve raw JSON at /api-docs/swagger.json
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

module.exports = router;