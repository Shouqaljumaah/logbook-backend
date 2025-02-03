const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const { fromAuthHeaderAsBearerToken } = require("passport-jwt").ExtractJwt;
const { JWT_SECRET } = require("./key");
const Users = require("./models/Users");

exports.localStrategy = new LocalStrategy(
  { usernameField: "username" },
  async (username, password, done) => {
    try {

      const user = await Users.findOne({ username });
      const passwordsMatch = user
        ? await bcrypt.compare(password, user.password)
        : false;
      if (passwordsMatch) {
        console.log("passwordsMatch", passwordsMatch);
        return done(null, user);
      } else {
        done(false);
      }
    } catch (error) {
      done(error);
    }
  }
);

const jwtVerify = async (jwtPayload, done) => {
  try {
    console.log("JWT Payload in verify:", jwtPayload); // Debug log
    
    // Check token expiration 
    if (jwtPayload.role === 'admin') {
      if (Date.now() > jwtPayload.exp) {
        console.log("Admin jwt expired");
        return done(null, false);
      }
    }

    // Find user by ID
    const user = await Users.findById(jwtPayload.id);
    console.log("Found user:", user); // Debug log

    if (!user) {
      console.log("No user found with ID:", jwtPayload.id);
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    console.error("JWT Verify error:", error);
    return done(error);
  }
};

exports.jwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  },
  jwtVerify
);