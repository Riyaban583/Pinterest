const express = require('express');
const passport = require('passport');
const User = require('../models/users'); // This path is now correct
const Post = require('../models/post');  // This path will also be correct
const path = require('path');             // NEW: Required for file paths
const multer = require('multer');         // NEW: Required for file uploads
const router = express.Router();

// NEW: Multer configuration for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Home page
router.get('/', (req, res) => {
  res.redirect('/register');
});

// Show register form
router.get('/register', (req, res) => {
  res.render('index', { messages: req.flash() });
});

// Handle registration
router.post('/register', (req, res, next) => {
  const { username, email, fullname, password } = req.body;
  const newUser = new User({ username, email, fullname });

  User.register(newUser, password)
    .then(registeredUser => {
      passport.authenticate('local')(req, res, () => {
        req.flash('success_msg', 'You are now registered and logged in!');
        res.redirect('/profile');
      });
    })
    .catch(err => {
      req.flash('error_msg', err.message);
      res.redirect('/register');
    });
});

// Show login form
router.get('/login', (req, res) => {
  res.render('login', { messages: req.flash() });
});

// Handle login
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: 'Invalid username or password.',
  successFlash: 'Welcome back!'
}));

// UPDATED: Protected profile page route
router.get('/profile', isLoggedIn, async (req, res) => {
  // Find the logged-in user and populate their 'posts' array
  // This fetches the actual post data instead of just the IDs
  const user = await User.findOne({ username: req.user.username }).populate('posts');
  res.render('profile', { user: user }); // Pass the full user object to the view
});

// NEW: Route to handle post creation
router.post('/createpost', isLoggedIn, upload.single('postimage'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file was uploaded.');
  }
  
  // Find the logged-in user
  const user = await User.findOne({ username: req.user.username });

  // Create the new post using data from the form
  const post = await Post.create({
    user: user._id,
    caption: req.body.caption,
    imageUrl: req.file.filename // The unique filename from multer
  });

  // Add the new post to the user's 'posts' array
  user.posts.push(post._id);
  await user.save(); // Save the updated user document

  res.redirect('/profile');
});


// Feed page
router.get('/feed', isLoggedIn, (req, res) => {
  res.render('feed', { username: req.user.username });
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'You have successfully logged out.');
    res.redirect('/login');
  });
});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'You must be logged in to view that page.');
  res.redirect('/login');
}

module.exports = router;