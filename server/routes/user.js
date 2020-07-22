const express = require('express');
const router = express.Router();
const userController = require('../controller/user');
const isAuth = require('../middleware/is-auth');

router.get('/my-resource', isAuth, userController.getMyResource);
router.get('/my-likes', isAuth, userController.getMyLikes)
router.post('/add-user-resource', isAuth, userController.postUserResource);
router.post('/review', isAuth, userController.postReview)
router.get('/review-list', userController.getReviews)
router.get('/details', userController.getDetails)
router.post('/like', isAuth, userController.postLike)
router.get('/my-likes', isAuth, userController.getLikes)
router.post('/contact', userController.postContact)

module.exports = router