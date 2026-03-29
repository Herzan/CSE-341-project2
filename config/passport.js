// config/passport.js
require('dotenv').config();   // ← Safety net (in case server.js doesn't load it first)

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

console.log('🔑 Loading GitHub OAuth config...'); // ← For debugging
console.log('GITHUB_CLIENT_ID exists:', !!process.env.GITHUB_CLIENT_ID);
console.log('GITHUB_CLIENT_SECRET exists:', !!process.env.GITHUB_CLIENT_SECRET);

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.error('❌ Missing GitHub OAuth credentials in .env file!');
  console.error('Make sure you have:');
  console.error('GITHUB_CLIENT_ID=...');
  console.error('GITHUB_CLIENT_SECRET=...');
  console.error('CALLBACK_URI=...');
}

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URI || 'http://localhost:5000/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });

      if (!user) {
        user = await new User({
          githubId: profile.id,
          displayName: profile.displayName || profile.username,
          email: profile.emails?.[0]?.value || null,
          photo: profile.photos?.[0]?.value || null,
          provider: 'github'
        }).save();
      }
      return done(null, user);
    } catch (err) {
      console.error('GitHub Strategy Error:', err);
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;