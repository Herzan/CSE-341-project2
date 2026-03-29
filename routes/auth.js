const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/api-docs');   // or wherever you want after login
  }
);

router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

module.exports = router;