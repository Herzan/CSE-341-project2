// server.js
// ====================== LOAD ENVIRONMENT VARIABLES FIRST ======================
require('dotenv').config({ 
  path: '.env'   // explicit path - helps in some cases
});

console.log('✅ dotenv loaded');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Present' : '❌ MISSING');
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✅ Present' : '❌ MISSING');

// Now require everything else
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');   // ← Now it should see the env vars

// ... rest of your file stays the same

const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5000',
  credentials: true
}));

app.use(express.json());

// Session setup (connect-mongo v6+)
app.use(session({
  secret: process.env.SESSION_SECRET || '8fK9pL2mX7qR4vT6wY8zA3bC5dE7fG9hJ1kL3mN5oP7qR9sT2uV4wX6yZ8aB0cD2eF4gH6iJ8kL0mN2oP4qR6sT8uV0wX2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ0aB2cD4eF6gH8iJ0kL2mN4oP6qR8sT0uV2wX4yZ6aB8cD0eF2gH4iJ6kL8mN0oP2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4mN6oP8qR0sT2uV4wX6yZ8aB0cD2eF4',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,           // 1 day
    autoRemove: 'interval',
    autoRemoveInterval: 10,      // minutes
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ====================== DATABASE ======================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ====================== ROUTES ======================

// Auth routes - GitHub OAuth
app.get('/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/' 
  }),
  (req, res) => {
    res.redirect('/api-docs');
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout error' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      _id: req.user._id,
      displayName: req.user.displayName,
      email: req.user.email,
      photo: req.user.photo,
      provider: req.user.provider || 'github'
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// API Routes
const bookHandler   = require('./routes/bookHandler');
const authorHandler = require('./routes/authorHandler');
const swaggerRoutes = require('./routes/swagger');

app.use('/api/books',   bookHandler);
app.use('/api/authors', authorHandler);
app.use('/api-docs',    swaggerRoutes);

// ====================== ROOT ROUTE (Only ONE!) ======================
app.get('/', (req, res) => {
  res.json({
    message:     'Book Library API is running',
    docs:        '/api-docs          → interactive Swagger UI',
    rawSpec:     '/api-docs/swagger.json → static OpenAPI JSON',
    mongodb:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth:        req.isAuthenticated() ? 'logged in' : 'not logged in',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ====================== GLOBAL ERROR HANDLER (should be last) ======================
// Remove the duplicate app.get('/') and use proper error handling middleware instead:
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ====================== START SERVER ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`→ Swagger UI:     http://localhost:${PORT}/api-docs`);
  console.log(`→ GitHub Login:   http://localhost:${PORT}/github`);
  console.log(`→ Current User:   http://localhost:${PORT}/current-user`);
});