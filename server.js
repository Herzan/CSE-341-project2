// server.js - FIXED & IMPROVED VERSION
require('dotenv').config({ path: '.env' });

console.log('✅ dotenv loaded');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Present' : '❌ MISSING');
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✅ Present' : '❌ MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');

const app = express();

app.use('/', authRoutes);

// ====================== MIDDLEWARE ======================
app.use(cors({
  origin: '*',           // Change to specific origin(s) in production if possible
  credentials: true
}));

app.use(express.json());

// Session setup (reliable for connect-mongo)
const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: 'sessions',
  ttl: 24 * 60 * 60,     // 1 day in seconds
  autoRemove: 'native'
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24,   // 1 day
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

// GitHub Callback - FIXED
app.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/', 
    failureMessage: true 
  }),
  (req, res) => {
    res.redirect('/api-docs');
  }
);

// Improved Logout (Passport v0.6+ requires callback)
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return next(err);

      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });

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

// API Routes
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
    currentUser: '/current-user'
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
  console.log(`→ Login URL: https://cse-341-project2-ea66.onrender.com/github`);
});