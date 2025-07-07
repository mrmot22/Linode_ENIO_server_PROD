require('dotenv').config();

const express = require('express');
const path = require('path');
const passport = require('passport');
const flash = require('express-flash')
const session = require('express-session');
const mongoose = require('mongoose');  
const initializePassport = require("./scripts/passport-config")
initializePassport(passport)   

const app = express();
const port = 3000;


app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));
app.use(flash());


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 3 * 60, // aktuálne nastavené na 30 minut 
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

const mongoURI = process.env.DODB_URI;

mongoose.connect(mongoURI, { })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// ---------------------------------------------------------------- začiatok kódu


app.get('/', checkAuthenticated, async (req, res) => {


  res.redirect('/DT-region');


})  

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login',
  passport.authenticate("local", {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })
 )

 
// Nadefinovanie routerov
const DT_vs_Odch_Router = require('./routes/DT_vs_Odch')
const DT_vs_IDA_Router = require('./routes/DT_vs_IDA')
const PICASSO_pre_Router = require('./routes/PICASSO_pre')
const PICASSO_4s_Router = require('./routes/PICASSO_4s')
const PICASSO_LMOL_Router = require('./routes/PICASSO_lmol')
const PICASSO_UNIT_Router = require('./routes/PICASSO_unit')
const DT_region_Router = require('./routes/DT_region')
const RE_aktivovana_Router = require('./routes/SEPS_RE_aktiv')
const PpS_disponibilita_Router = require('./routes/SEPS_PpS_dispo')
const market_orderbook_Router = require('./routes/market-orderbook')


// Využitie routerov pre jednotlivé routy

app.use('/DT-vs-Odch', DT_vs_Odch_Router)
app.use('/DT-vs-IDA', DT_vs_IDA_Router)
app.use('/PI-prehlad', PICASSO_pre_Router)
app.use('/PI-4s', PICASSO_4s_Router)
app.use('/PI-LMOL', PICASSO_LMOL_Router)
app.use('/PI-UNIT', PICASSO_UNIT_Router)
app.use('/DT-region', DT_region_Router)
app.use('/RE-SEPS', RE_aktivovana_Router)
app.use('/PpS-SEPS', PpS_disponibilita_Router)
app.use('/market-orderbook', market_orderbook_Router)

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}   