const User = require('../models/user');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const sendMail = require('./../util/mail')

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
                    const newMessage = {
                        from: process.env.MY_EMAIL,
                        to: email,
                        subject: 'Thanks for signing up!',
                        text: 'We appreciate you signing up to use this site! Please visit us soon to add resources and browse current supportive services in the area. Your username for login is ' + username + ' or you can simply log in with your email. Thanks again!'
                    };
                    return sendMail(newMessage)
                        .then(() => {
                            res.json({
                                success: true
                            })
                        })
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
    const { email } = req.body;
    crypto
        .randomBytes(32, (err, buffer) => {
            if (err) {
                console.log(err)
                const error = new Error("Hmm something went wrong. Please try again!");
                error.statusCode = 500;
                throw error;
            }
            const token = buffer.toString('hex');
            User
                .findOne({
                    email: email
                })
                .then(user => {
                    if (!user) {
                        const error = new Error("No user exists!");
                        error.statusCode = 401;
                        throw error;
                    }
                    user.resetToken = token;
                    user.resetExpiry = Date.now() + 3600000;
                    return user.save();
                })
                .then(() => {
                    const newMessage = {
                        from: process.env.MY_EMAIL,
                        to: email,
                        subject: 'Password Reset',
                        html: `
                        <p>You have requested a password reset</p>
                        <p>Click this <a href='${process.env.APPROVED_URL}/reset/${token}'>link</a> to reset</p>
                        `
                    };
                    return sendMail(newMessage)
                        .then(() => {
                            res.json({
                                success: true
                            })
                        })
                })
                .catch(err => {
                    if (!err.statusCode) {
                        err.statusCode = 500
                    }
                    next(err)
                })
        })
}

exports.getChangePw = (req, res, next) => {
    const resetId = req.query.resetId.toString();
    User
        .findOne({
            resetToken: resetId,
            resetExpiry: { $gt: Date.now() }
        })
        .then(user => {
            if (!user) {
                return res.json({
                    success: false
                })
            }
            return res.json({
                success: true,
                userId: user._id
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.postChangePw = (req, res, next) => {
    const { password, confPassword, resetId, userId } = req.body;
    let resetUser;
    if (password !== confPassword) {
        const error = new Error("Passwords need to match! Thanks :)");
        error.statusCode = 401;
        throw error;
    }
    User
        .findOne({
            resetToken: resetId,
            resetExpiry: { $gt: Date.now() },
            _id: userId
        })
        .then(user => {
            resetUser = user;
            if (!user) {
                const error = new Error("Could not locate your account. Please try sending your email again on the Reset page.");
                error.statusCode = 401;
                throw error;
            }
            return bcrypt
                .hash(password, 12)
        })
        .then(hashedPw => {
            resetUser.password = hashedPw;
            resetUser.resetExpiry = undefined;
            resetUser.resetToken = undefined;
            return resetUser.save()
        })
        .then(result => {
            return res.json({
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