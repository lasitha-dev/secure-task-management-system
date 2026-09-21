const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-client-secret',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/users/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists by googleId
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // Check if user exists by email (link accounts)
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  // Serialization for session support (not used in JWT mode, but required by passport)
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = configurePassport;
