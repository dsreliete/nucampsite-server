const passport = require('passport');
//provide methods to local strategy to passport plugin
const LocalStrategy = require('passport-local').Strategy; 
//provide strategy for passport-jwt plugin base authentication
const JwtStrategy = require('passport-jwt').Strategy; 
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const FacebookTokenStrategy = require('passport-facebook-token');
const User = require('./models/user');
const conf = require('./config');

//handle authentication with username/password stored on server:
//local strategy is passed to passport.use method with verifyFuction from userSchema linked 
//to passportLocalMongoose:User.authenticate method
exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Token has: header with token type and algorithm
// payload with info that helps identify user, example userid
// signature garantee message authencity
exports.getToken = function(user) {
    return jwt.sign(user, conf.secretKey, {expiresIn: 3600});
};

//config to passport-jwt strategies
const opts = {};
// the client will send JWT token in Authorization Header as a Bearer Token. 
// The Passport JWT Strategy supports many other ways of getting the token from requests.
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = conf.secretKey;

//pass JWTstartegy to passport with options and verifyFunction
exports.jwtPassport = passport.use(
    new JwtStrategy(
        opts,
        //decoded JWT payload and a passport callback 
        (jwt_payload, done) => {
            console.log('JWT payload:', jwt_payload);
            User.findOne({_id: jwt_payload._id}, (err, user) => {
                if (err) {
                    return done(err, false);
                } else if (user) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        }
    )
);

//provide user authentication with jwt strategy and no sessions
exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = (req, res, next) => {
    if(req.user.admin === true){
        return next();
    } else {
        const err = new Error("You are not authorized to perform this operation!");
        err.status = 404;
        return next(err);
    }
};

exports.facebookPassport = passport.use(
    new FacebookTokenStrategy(
        {
            clientID: conf.facebook.clientId,
            clientSecret: conf.facebook.clientSecret
        }, 
        (accessToken, refreshToken, profile, done) => {
            User.findOne({facebookId: profile.id}, (err, user) => {
                if (err) {
                    return done(err, false);
                }
                if (!err && user) {
                    return done(null, user);
                } else {
                    user = new User({ username: profile.displayName });
                    user.facebookId = profile.id;
                    user.firstname = profile.name.givenName;
                    user.lastname = profile.name.familyName;
                    user.admin = true;
                    console.log(user.firstname, user.admin)
                    user.save((err, user) => {
                        if (err) {
                            return done(err, false);
                        } else {
                            return done(null, user);
                        }
                    });
                }
            });
        }
    )
);