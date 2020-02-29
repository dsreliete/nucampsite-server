const express = require('express');
const passport = require('passport');

const User = require('../models/user');
const authenticate = require('../authenticate');
const cors = require('./cors');

const userRouter = express.Router();

userRouter.get('/', cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find()
  .then(users => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  })
  .catch(err => next(err));
});

userRouter.get('/test', cors.corsWithOptions, function(req, res, next) {
  User.find()
  .then(users => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  })
  .catch(err => next(err));
})

userRouter.post('/signup', cors.corsWithOptions, (req, res) => {
  //static method from passpot-local-mongoose to register username and pswd
  User.register(new User({username: req.body.username}),
      req.body.password,
      (err, user) => {
          if (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.json({err: err});
          } else {
            if (req.body.firstname) {
              user.firstname = req.body.firstname;
            }
            if (req.body.lastname) {
              user.lastname = req.body.lastname;
            }
            if (req.body.admin) {
              user.admin = req.body.admin;
            }
            user.save(err => {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                    return;
                }
                //authenticate the newly registered user
                passport.authenticate('local')(req, res, () => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({success: true, status: 'Registration Successful!'});
                });
            });
          }
      }
  );
});

//passport.autenticate method is a second middleware used to authenticate a username and password,
// given from passport-local 
// If success return a user on request object with info about the user and pass to next middleware. 
userRouter.post('/login', cors.corsWithOptions, passport.authenticate('local'), (req, res) => {
  //get token from req.user and pass response
  const token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

userRouter.get('/logout', cors.corsWithOptions, (req, res, next) => {
  res.redirect('/');
});

userRouter.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
      const token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, token: token, status: 'You are successfully logged in!'});
  }
});

module.exports = userRouter;
