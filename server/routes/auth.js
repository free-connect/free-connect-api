const express = require('express');
const router = express.Router();
const AuthController = require('../controller/auth')
const { body } = require('express-validator');
const User = require('../models/user');

router.post(
    '/register',
    body('email')
        .isEmail()
        .withMessage('please enter valid email')
        .custom((val, { req }) => {
            return User.findOne({
                email: val
            })
                .then(userCheck => {
                    if (userCheck) {
                        return Promise.reject('email already exists!')
                    }
                })
        })
        .normalizeEmail(),
    body(
        'password',
        'Use a passphrase! Passphrases must be at lease 12 characters long.')
        .isLength({ min: 12 })
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((val, { req }) => {
            if (val !== req.body.password) {
                throw new Error('passwords do not match')
            } else {
                return true
            }
        }),
    AuthController.postRegister
);
router.post('/login', AuthController.postLogin);
router.post('/reset', AuthController.postReset);
router.get('/change-password', AuthController.getChangePw);
router.post('/change-password', AuthController.postChangePw);


module.exports = router