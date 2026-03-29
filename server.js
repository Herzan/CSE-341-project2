// server.js
require('dotenv').config({ path: '.env' });

console.log('✅ dotenv loaded');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Present' : '❌ MISSING');
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✅ Present' : '❌ MISSING');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');

const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json());

// Session setup - Simplified and reliable for connect-mongo v6
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,   // 1 day
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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

// GitHub Login
app.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => res.redirect('/api-docs')
);

// FIXED Logout
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.json({ 
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

app.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// API Routes - Use authorHandler (the one with isAuthenticated protection)
const bookHandler   = require('./routes/bookHandler');
const authorHandler = require('./routes/authorHandler');
const swaggerRoutes = require('./routes/swagger');

app.use('/api/books',   bookHandler);
app.use('/api/authors', authorHandler);
app.use('/api-docs',    swaggerRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Book Library API is running ✅',
    login: '/github',
    logout: '/logout',
    docs: '/api-docs',
    currentUser: '/current-user',
    status: 'OK'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`→ Login:  https://cse-341-project2-ea66.onrender.com/github`);
  console.log(`→ Logout: https://cse-341-project2-ea66.onrender.com/logout`);
  console.log(`→ Swagger: /api-docs`);
});