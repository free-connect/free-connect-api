const express = require('express');
const adminController = require('../controller/admin')
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');

router.post('/',
    body('title',
        'title is too short! Needs to be at least three characters')
        .trim()
        .isLength({ min: 3 }),
    isAuth,
    adminController.postAddResource);
router.get('/data/resources', adminController.getResources);
router.get('/data/register', adminController.getRegisterResources)
router.post('/edit-resource',
    body('title',
        'title is too short! Needs to be at least three characters')
        .trim()
        .isLength({ min: 3 }),
    isAuth,
    adminController.postEditResource);
router.post('/delete-resource', isAuth, adminController.postDeleteResource);

module.exports = router