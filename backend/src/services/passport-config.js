// src/services/passport-config.js
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { User } = require("../models");

module.exports = (app) => {
  // Register the Google strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            where: { email: profile.emails[0].value },
          });
          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  // Initialise passport
  app.use(passport.initialize());
};
