const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');   // Make sure this path is correct

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Session setup (MUST be before passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI 
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24,   // 1 day
    secure: false   // Set to true in production with HTTPS
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ======================
// Auth routes - GitHub OAuth (using your provided credentials)
// ======================
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

// ======================
// Your existing routes
// ======================
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
    auth:      req.isAuthenticated() ? 'logged in' : 'not logged in'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`→ Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`→ GitHub Login: http://localhost:${PORT}/github`);
});