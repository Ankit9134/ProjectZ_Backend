const dotenv = require("dotenv");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const { Strategy: TwitterStrategy } = require("passport-twitter");
const UserModel = require("../models/user");
const bcrypt = require("bcryptjs");
dotenv.config({ path: ".env.development" });

const configureAuth = (passport) => {
  // **Google Strategy**
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const username = profile.displayName
            .replace(/\s+/g, "")
            .toLowerCase();

          let user = await UserModel.findOne({
            $or: [{ googleId: profile.id }, { email }, { username }],
          });

          if (!user) {
            // Generate a dummy random password
            const dummyPassword = bcrypt.hashSync(
              Math.random().toString(36).slice(-8),
              10
            );
            user = new UserModel({
              googleId: profile.id,
              username: profile.displayName,
              email,
              password: dummyPassword, // Store hashed dummy password
              image: profile.photos?.[0]?.value,
            });
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          console.error("Google Authentication Error:", error);
          return done(error, null);
        }
      }
    )
  );

  // **Facebook Strategy**
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["id", "displayName", "emails", "photos"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value || `fbuser_${profile.id}@nomail.com`;

          let user = await UserModel.findOne({ email });

          if (!user) {
            // Generate a dummy random password
            const dummyPassword = bcrypt.hashSync(
              Math.random().toString(36).slice(-8),
              10
            );

            user = new UserModel({
              facebookId: profile.id,
              username: profile.displayName || `fbuser_${profile.id}`,
              email,
              password: dummyPassword, // Store hashed dummy password
              image: profile.photos?.[0]?.value || null,
            });
            await user.save();
            console.log("New User with Dummy Password Saved:", user);
          } else {
            console.log("Existing User Found:", user);
          }

          return done(null, user);
        } catch (error) {
          console.error("Facebook Authentication Error:", error);
          return done(error, null);
        }
      }
    )
  );

  // **Twitter Strategy**
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL,
        includeEmail: true,
      },
      async (token, tokenSecret, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value ||
            `twitteruser_${profile.id}@nomail.com`;
          const username = profile.username || `twitteruser_${profile.id}`;

          let user = await UserModel.findOne({
            $or: [{ twitterId: profile.id }, { email }, { username }],
          });

          if (!user) {
            // Generate a dummy random password
            const dummyPassword = bcrypt.hashSync(
              Math.random().toString(36).slice(-8),
              10
            );
            user = new UserModel({
              twitterId: profile.id,
              username: profile.displayName || username,
              password: dummyPassword, // Store hashed dummy password
              email,
              image: profile.photos?.[0]?.value || null,
              role: user.role,
            });

            await user.save();
          } else if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          console.error("Twitter Authentication Error:", error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = configureAuth;
