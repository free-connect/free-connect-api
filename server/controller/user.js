const User = require('../models/user');
const Resource = require('../models/resources')
const ObjectId = require('mongodb').ObjectID;

exports.getMyResource = (req, res, next) => {
    User
        .findOne({
            _id: req.userId
        })
        .populate('affiliation')
        .then(user => {
            if (!user) {
                throw new Error('no such user')
            }
            const myResource = user.affiliation;
            res.json(myResource)
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
};

exports.getMyLikes = (req, res, next) => {
    User
        .findOne({
            _id: req.userId
        })
        .populate('likes')
        .then(user => {
            const likes = user.likes.map(a => {
                return {
                    title: a.title,
                    dynamicData: a.dynamicData,
                    id: a._id
                }
            })
            res.send({
                likes: likes
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.getDetails = (req, res, next) => {
    return Resource
        .findOne({
            _id: ObjectId(req.query.id)
        })
        .then(resource => {
            if (!resource) {
                throw new Error('No such resource.')
            }
            res.json({
                data: resource.title
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.getReviews = (req, res, next) => {
    Resource
        .find({
            _id: req.query.resId
        })
        .deepPopulate('reviews.userId')
        .then(rev => {
            if (!rev[0]) {
                throw new Error('not a valid resource');
            }
            let data = rev[0]['reviews'].map(a => [a.userId.username, a.review])
            res.json({
                success: true,
                data: data
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.postReview = (req, res, next) => {
    const { resourceId, review } = req.body;
    const user = req.userId;
    let resId = '';
    User
        .findOne({
            _id: user
        })
        .then(user => {
            resId = user.affiliation;
            if (!resId) {
                const error = new Error('no affiliation');
                error.statusCode = 401;
                throw error
            }
            if (resId.toString() === resourceId.toString()) {
                const error = new Error("Can't review your own resource!");
                error.statusCode = 401;
                throw error
            }
        })
        .then(() => {
            Resource
                .findOne({
                    _id: resourceId
                })
                .then(checkResource => {
                    let test = checkResource.reviews.find(a => a.userId.toString() === user.toString());
                    if (test) {
                        const error = new Error("Resource already reviewed!");
                        error.statusCode = 401;
                        throw error
                    } else {
                        return checkResource
                    }
                })
                .then(resource => {
                    resource.reviews.push({
                        userId: user,
                        review: review
                    })
                    return resource
                        .save()
                        .then(() => {
                            res.json({
                                success: true
                            })
                        })
                        .catch(err => next(err))
                })
                .catch(err => {
                    next(err)
                })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.postUserResource = (req, res, next) => {
    const affiliation = ObjectId(req.body.affiliation);
    User
        .findOneAndUpdate(
            { _id: req.userId },
            { affiliation: affiliation },
            { new: true }
        )
        .then(() => {
            res.json({
                success: true
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.postLike = (req, res, next) => {
    let newLikedRes = req.body.likedId
    User
        .findOne({
            _id: req.userId
        })
        .then(user => {
            if (user.likes.includes(newLikedRes)) {
                const error = new Error("Resource already liked!");
                error.statusCode = 401;
                throw error
            } else if (user.affiliation.toString() === newLikedRes.toString()) {
                const error = new Error("Can't like your own resource!");
                error.statusCode = 401;
                throw error
            }
            user.likes.push(newLikedRes)
            return user.save()
        })
        .then(() => {
            res.json({
                success: true
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.getLikes = (req, res, next) => {
    User
        .findOne({
            _id: req.userId
        })
        .then(user => {
            res.json({
                likes: user.likes
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}