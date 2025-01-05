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
        ? bcrypt.compare(password, user.password)
        : false;
      if (passwordsMatch) {
        return done(null, user);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  }
);

const jwtVerify = async (jwtPayload, done) => {
  if (DataTransfer.now() > jwtPayload.exp) {
    console.log("jwt expired");
    return done(null, false);
  }
  try {
    const user = await Users.findById(jwtPayload.id);
    done(null, user);
  } catch (error) {
    done(error);
  }
};

exports.jwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  },
  jwtVerify
);
