const Resource = require('../models/resources');
const User = require('../models/user');
const update = require('../util/imageUploadS3');
const { validationResult } = require('express-validator');
const aws = require("aws-sdk");
const s3 = new aws.S3();

function compare(check, arrs) {
    const newCheck = [...check]
    let count = 0;
    while (newCheck[0]) {
        if (arrs.includes(newCheck[newCheck.length - 1])) {
            count++
        }
        newCheck.pop()
    };
    return count
}

function trimPhone(val) {
    let trimmedVal = val.split(/\D+/gi).join('').trim();
    return `(${trimmedVal.substring(0, 3)}) ${trimmedVal.substring(3, 6)}-${trimmedVal.substring(6, 10)}`
}
const trimTitle = (val) => val.split(/\s+/).map(a => a[0].toUpperCase() + a.substring(1)).join(' ');

exports.getResources = (req, res, next) => {
    const queryServices = req.query.services;
    const currentPage = parseInt(req.query.page) || 1;
    const city = req.query.city || '';
    const services = queryServices ? queryServices.split(',') : [];
    let totalRes;
    const perPage = 4;
    return Resource
        .find(city ?
            { city: city } :
            null)
        .then(resources => {
            totalRes = resources.length;
            let sorted = [];
            if (services[0]) {
                //see the above compare function. Services are stored in db as an object
                sorted = resources.sort((a, b) => {
                    return compare(services, Object.keys(b.services)) - compare(services, Object.keys(a.services))
                })
            } else {
                sorted = resources
            }
            sorted = sorted.splice((currentPage - 1) * perPage, perPage);
            return sorted;
        })
        .then(sortedResources => {
            res.json({
                resources: sortedResources,
                totalRes: totalRes
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.getRegisterResources = (req, res, next) => {
    //this 'GET' ensures that if someone is registering, 
    //we don't need to send back all the data, just a list of names and id
    return Resource
        .find()
        .then((resource) => {
            let newResource = resource.map(a => {
                return {
                    title: a.title,
                    _id: a._id
                }
            })
            res.json(newResource)
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.postAddResource = (req, res, next) => {
    const { title, address, phone, website, city } = req.body;
    const services = JSON.parse(req.body.services);
    const dynamicData = JSON.parse(req.body.dynamicData);
    const errors = validationResult(req);
    //this section handles the image file. If there is none, it sends this error
    if (!req.file) {
        return res.json({
            errors: 'No image provided or did not load properly! Try again'
        })
    }
    //this handles the validation errors
    if (!errors.isEmpty()) {
        return res.json({
            errors: errors.array()
        })
    }
    //this section sanitizes some data
    const imageUrl = req.file.location;
    const newTitle = trimTitle(title);
    const newPhone = trimPhone(phone);
    const resource = new Resource({
        title: newTitle,
        address: address,
        phone: newPhone,
        url: imageUrl,
        website: website,
        services: services,
        dynamicData: dynamicData,
        city: city
    })
    resource
        .save()
        .then(data => {
            res.json({
                success: true,
                affiliation: data._id
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.postEditResource = (req, res, next) => {
    const { title, address, phone, website, id, city } = req.body;
    const dynamicData = JSON.parse(req.body.dynamicData);
    const services = JSON.parse(req.body.services)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({
            errors: errors.array()
        })
    }
    const newTitle = trimTitle(title)
    const newPhone = trimPhone(phone)
    if (req.userId !== process.env.ADMIN_ID) {
        User
            .findById(req.userId)
            .then(user => {
                if (user.affiliation.toString() !== id.toString()) {
                    const error = new Error("Sorry, you don't have permission to edit this resource!");
                    error.statusCode = 401;
                    throw error
                }
                return;
            })
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500
                }
                next(err)
            })
    }
    return Resource
        .findById(id)
        .then(resource => {
            resource.title = newTitle;
            resource.address = address;
            //only edits the image if a new file was sent
            if (req.file) {
                resource.url = req.file.location;
            }
            resource.services = services;
            resource.phone = newPhone;
            resource.website = website;
            resource.city = city;
            resource.dynamicData = dynamicData;
            return resource.save()
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

exports.postDeleteResource = (req, res, next) => {
    const idToDelete = req.body.id;
    //delete local image file
    Resource
        .findById(idToDelete)
        .then(resource => {
            let newResource = resource.url
            let resourceUrl = newResource.toString().split('/');
            resourceUrl = resourceUrl[resourceUrl.length - 1];
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: resourceUrl
            }
            s3.deleteObject(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    console.log(params);
                }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
    //delete resource itself
    return Resource
        .findByIdAndRemove(idToDelete)
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