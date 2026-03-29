const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');

require('dotenv').config();

const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Better for production
  credentials: true
}));
app.use(express.json());

// FIXED: Session setup for connect-mongo v6+
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',        // optional but recommended
    ttl: 24 * 60 * 60,                 // 1 day in seconds
    autoRemove: 'interval',
    autoRemoveInterval: 10,            // minutes
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24,       // 1 day
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

// Your existing route handlers
const bookHandler   = require('./routes/bookHandler');
const authorHandler = require('./routes/authorHandler');
const swaggerRoutes = require('./routes/swagger');

app.use('/api/books',   bookHandler);
app.use('/api/authors', authorHandler);
app.use('/api-docs',    swaggerRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message:   'Book Library API is running',
    docs:      '/api-docs          → interactive Swagger UI',
    rawSpec:   '/api-docs/swagger.json → static OpenAPI JSON',
    mongodb:   mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth:      req.isAuthenticated() ? 'logged in' : 'not logged in',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.get('/', (req, res) => {
  res.json({
    message: 'Book Library API is running',
    docs: '/api-docs',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth: req.isAuthenticated() ? `logged in as ${req.user.displayName}` : 'not logged in',
    env: process.env.NODE_ENV || 'development'
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