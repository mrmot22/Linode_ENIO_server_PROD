const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const Datastore = require('nedb');
const db = new Datastore({ filename: './scripts/users.db', autoload: true });

function initialize(passport) {

    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      
      db.findOne({ email }, (err, user) =>{
        
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'Užívateľ s daným emailom neexistuje.'});

        bcrypt.compare(password, user.heslo, (err, isMatch) => {
        
          if (err) return done(err);
          if (!isMatch) return done(null, false, { message: 'Nesprávny email alebo heslo' });
  
          return done(null, user);

        })
      })
    }))
  

  passport.serializeUser((user, done) => {
      done(null, user);
  });
  
  passport.deserializeUser(async (id, done) => {

    try {

      const user = db.findOne({ _id: id})
      done(null, user);
    } catch {

      done(error, false);
    }

  })
}

module.exports = initialize