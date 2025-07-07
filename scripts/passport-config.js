const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
require('dotenv').config();

const userDbConnection = mongoose.createConnection(process.env.DODB2_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


// Define User schema on that connection
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  heslo: { type: String, required: true },
});


const User = userDbConnection.model('User', UserSchema, 'EnioUsers');

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    try {
      // Normalize email (lowercase + trim whitespace)
      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) return done(null, false, { message: 'No user with that email' });

      const isMatch = await bcrypt.compare(password, user.heslo);
      if (isMatch) return done(null, user);
      else return done(null, false, { message: 'Password incorrect' });
    } catch (err) {
      return done(err);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
