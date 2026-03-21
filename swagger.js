// swagger.js - Helper to load/export OpenAPI spec
const fs = require('fs');
const path = require('path');

const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8')
);

module.exports = swaggerDocument;