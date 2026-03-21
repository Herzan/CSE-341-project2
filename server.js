const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Useful for PaaS platforms (Render, Railway, Fly.io, etc.)
  });

// Routes
//const bookRoutes    = require('./routes/bookRoutes');
const authorHandler = require('./routes/authorHandler');  // single-file handler
const swaggerRoutes = require('./routes/swagger');        // serves UI + /swagger.json

//app.use('/api/books',   bookRoutes);
app.use('/api/authors', authorHandler);
app.use('/api-docs',    swaggerRoutes);

// Root route – quick health check
app.get('/', (req, res) => {
  res.json({
    message:   'Book Library API is running',
    docs:      '/api-docs          → interactive Swagger UI',
    rawSpec:   '/api-docs/swagger.json  → static OpenAPI JSON',
    mongodb:   mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Global error handler (must be after all routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Server error',
    error:   err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Swagger UI:   http://localhost:${PORT}/api-docs`);
  console.log(`OpenAPI JSON: http://localhost:${PORT}/api-docs/swagger.json`);
});