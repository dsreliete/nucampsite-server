const express = require('express');
const bodyParser = require('body-parser');

const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find()
    .populate('user')
    .populate('campsites')
    .then(favCampsites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favCampsites);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Favorite.findOne({'user': req.user._id})
    .then(campsite => {
        if(campsite){
            req.body.forEach(element => {
                if (campsite.campsites.includes(element._id)){
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(`This campsite has already included`);
                } else {
                    campsite.campsites.push(element)
                    campsite.save()
                    .then(elem => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(elem);
                    })
                    .catch(err => next(err));
                }
            });
        } else {
            const favoriteCampsite = new Favorite({user: req.user._id, campsites: req.body});
            Favorite.create(favoriteCampsite)
            .then(favCampsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favCampsite);
            })
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin ,(req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Favorite.findOne({'user': req.user._id})
    .then(campsite => {
        if(campsite){
            Favorite.findByIdAndDelete(campsite._id)
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(`There is no campsite to delete`);
        }
    })
    .catch(err => next(err));
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({'user': req.user._id})
    .then(campsite => {
        if(campsite){
            if (campsite.campsites.includes(req.params.campsiteId)){
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(`This campsite has already included`);
            } else {
                campsite.campsites.push(req.params.campsiteId)
                campsite.save()
                .then(elem => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(elem);
                })
                .catch(err => next(err));
            }
        } else {
            const favoriteCampsite = new Favorite({user: req.user._id, campsites: req.params.campsiteId});
            Favorite.create(favoriteCampsite)
            .then(favCampsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favCampsite);
            })
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({'user': req.user._id})
    .then(campsite => {
        if(campsite) {
            if (campsite.campsites.includes(req.params.campsiteId)) {
                const campsiteIndex = campsite.campsites.indexOf(req.params.campsiteId);
                const splicedCampsite = campsite.campsites.splice(campsiteIndex, 1);
                campsite.save()
                .then(camp => {
                    if(camp.campsites.length === 0){
                        Favorite.findByIdAndDelete(camp._id)
                        .then(response => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(response);
                        })
                        .catch(err => next(err));
                    } else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(camp);
                    }
                })
                .catch(err => next(err));
            } 
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(`Is not possible to delete the campsite ${req.params.campsiteId}`);
        }
    })
    .catch(err => next(err));
});

module.exports = favoriteRouter;