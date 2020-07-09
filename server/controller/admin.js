const Resource = require('../models/resources');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file')

function compare(check, arrs) {
    check = [...check]
    let count = 0;
    while (check[0]) {
        if (arrs.includes(check[check.length - 1])) {
            count++
        }
        check.pop()
    };
    return count
}

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
            return sorted
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
    const imageUrl = req.file.path.replace('\\', '/');
    let newTitle = title.split(/\s+/).map(a => a[0].toUpperCase() + a.substring(1)).join(' ');
    let newPhone = phone.split(/\D+/gi).join('').trim();
    newPhone = `(${newPhone.substring(0, 3)}) ${newPhone.substring(3, 6)}-${newPhone.substring(6, 10)}`
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
    let newTitle = title.split(/\s+/).map(a => a[0].toUpperCase() + a.substring(1)).join(' ');
    let newPhone = phone.split(/\D+/gi).join('').trim();
    newPhone = `(${newPhone.substring(0, 3)}) ${newPhone.substring(3, 6)}-${newPhone.substring(6, 10)}`
    Resource
        .findById(id)
        .then(resource => {
            resource.title = newTitle;
            resource.address = address;
            //only edits the image if a new file was sent
            if (req.file) {
                fileHelper.deleteFile(resource.url)
                resource.url = req.file.path;
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
            fileHelper.deleteFile(resource.url)
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