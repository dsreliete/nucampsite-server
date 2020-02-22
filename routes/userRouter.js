const express = require('express');
const passport = require('passport');

const User = require('../models/user');
const authenticate = require('../authenticate');

const userRouter = express.Router();

userRouter.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

userRouter.post('/signup', (req, res) => {
  User.register( //static method from passpot-local-mongoose to register username and pswd
      new User({username: req.body.username}),
      req.body.password,
      err => {
          if (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.json({err: err});
          } else {
              //authenticate the newly registered user
              passport.authenticate('local')(req, res, () => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json({success: true, status: 'Registration Successful!'});
              });
          }
      }
  );
});

//passport.autenticate method is a second middleware used to authenticate a username and password,
// given from passport-local 
// If success return a user on request object with info about the user and pass to next middleware. 
userRouter.post('/login', passport.authenticate('local'), (req, res) => {
  //get token from req.user and pass response
  const token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

userRouter.get('/logout', (req, res, next) => {
  res.redirect('/');
});

module.exports = userRouter;
