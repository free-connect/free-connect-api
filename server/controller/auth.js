const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator')

exports.postRegister = (req, res, next) => {
    const { username, password, affiliation, name, email } = req.body;
    //handles validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({
            errors: errors.array()
        })
    }
    //encrypt password with a secure salt of 12
    bcrypt
        .hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                username: username,
                password: hashedPw,
                affiliation: affiliation,
                name: name,
                email: email,
                likes: [],
                reviews: []
            })
            return user
                .save()
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
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
};

exports.postLogin = (req, res, next) => {
    const { password, username } = req.body;
    let AuthedUser;
    return User
        .findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        })
        .then(user => {
            if (!user) {
                const error = new Error("User doesn't exist. Please double check username/email!");
                error.statusCode = 401;
                throw error
            }
            AuthedUser = user;
            return bcrypt
                .compare(password, user.password)
                .then(match => {
                    if (!match) {
                        const error = new Error("Username/email and password don't match");
                        error.statusCode = 401;
                        throw error
                    };
                    const token = jwt.sign({
                        email: AuthedUser.email,
                        userId: AuthedUser._id.toString()
                    },
                        process.env.JWT_SECRET,
                        { expiresIn: '1hr' }
                    );
                    res.json({
                        token: token,
                        userId: AuthedUser._id,
                        name: AuthedUser.username,
                        success: true
                    })
                })
                .catch(err => {
                    if (!err.statusCode) {
                        err.statusCode = 500
                    }
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

exports.postReset = (req, res, next) => {
    //some logic for emailing new password, still working on this!
}