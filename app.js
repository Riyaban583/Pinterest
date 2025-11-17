const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressSession = require('express-session');
const passport = require('passport');
const flash = require('connect-flash'); // Added for user feedback
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/pinterest', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error(err));

// Import routes & user model
const indexRouter = require('./routes/index');
const User = require('./models/users');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: 'secretkey'
}));

app.use(flash()); // Added for user feedback
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to pass flash messages to all routes
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.user = req.user; // Makes user data available in all templates
  next();
});

// Routes
app.use('/', indexRouter);

// 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

module.exports = app;