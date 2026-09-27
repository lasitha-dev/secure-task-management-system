const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    throw new Error(
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL environment variables are required for OAuth configuration'
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email =
            (profile.emails && profile.emails[0] && profile.emails[0].value) ||
            (profile._json && profile._json.email);

          // Safely verify Google email before linking or creating
          const isVerified = Boolean(
            (profile.emails &&
              profile.emails[0] &&
              (profile.emails[0].verified === true || profile.emails[0].verified === 'true')) ||
            (profile._json &&
              (profile._json.email_verified === true || profile._json.email_verified === 'true'))
          );

          if (!email || !isVerified) {
            return done(new Error('Google email is unverified or missing'), null);
          }

          // Check if user already exists by googleId
          let user = await User.findOne({ googleId });
          if (user) return done(null, user);

          // Check if user exists by email (link accounts for verified email)
          user = await User.findOne({ email });
          if (user) {
            user.googleId = googleId;
            await user.save();
            return done(null, user);
          }

          // Create new user — explicitly enforce role: 'User'
          const name = profile.displayName || profile._json?.name || email.split('@')[0];
          user = await User.create({
            name,
            email,
            googleId,
            role: 'User',
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
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
