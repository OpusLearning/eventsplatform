const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const passport = require("passport");
const { User, Role } = require("../models");

const configurePassport = (app) => {
  if (process.env.NODE_ENV === "test") {
    // Mock Google OAuth Strategy for testing
    passport.use(
      new GoogleStrategy(
        {
          clientID: "mockClientId",
          clientSecret: "mockClientSecret",
          callbackURL: "/api/auth/google/callback",
        },
        (accessToken, refreshToken, profile, done) => {
          const mockProfile = {
            id: "mockGoogleId",
            displayName: "Test User",
            emails: [{ value: "testuser@example.com" }],
          };
          done(null, {
            id: 1,
            name: mockProfile.displayName,
            email: mockProfile.emails[0].value,
            roles: ["user"], // Mock role assignment
          });
        }
      )
    );

    // Mock JWT Strategy for testing
    const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: "mockJwtSecret",
    };

    passport.use(
      new JwtStrategy(jwtOptions, (jwtPayload, done) => {
        if (jwtPayload.id === 1) {
          return done(null, {
            id: 1,
            name: "Test User",
            email: "testuser@example.com",
            roles: ["user"], // Mock roles
          });
        } else {
          return done(null, false);
        }
      })
    );
  } else {
    // Google OAuth Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ where: { email: profile.emails[0].value } });
            if (!user) {
              user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
              });
            }

            const roles = await user.getRoles();
            user = user.toJSON();
            user.roles = roles.map((role) => role.name);

            return done(null, user);
          } catch (error) {
            console.error("Error during Google authentication:", error);
            return done(error, null);
          }
        }
      )
    );

    // JWT Strategy
    const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    };

    passport.use(
      new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
        try {
          const user = await User.findByPk(jwtPayload.id, { include: [Role] });
          if (!user) return done(null, false);

          const userWithRoles = user.toJSON();
          userWithRoles.roles = user.Roles.map((role) => role.name);

          return done(null, userWithRoles);
        } catch (error) {
          console.error("Error during JWT authentication:", error);
          return done(error, false);
        }
      })
    );
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id, { include: [Role] });
      if (!user) return done(new Error("User not found"), null);

      const userWithRoles = user.toJSON();
      userWithRoles.roles = user.Roles.map((role) => role.name);

      done(null, userWithRoles);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  app.use(passport.initialize());
};

module.exports = configurePassport;
