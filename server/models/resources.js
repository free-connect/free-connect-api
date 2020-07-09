const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const deepPopulate = require('mongoose-deep-populate')(mongoose)

const resourceSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    website: {
        type: String,
        required: true
    },
    services: {
        type: Object,
        required: true
    },
    dynamicData: [
        {
            name: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            },
            timestamp: {
                type: String,
                required: true
            }
        }
    ],
    city: {
        type: String,
        required: true
    },
    reviews: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            review: {
                type: String,
                required: true
            }
        }
    ]
});

resourceSchema.plugin(deepPopulate)

module.exports = mongoose.model('Resource', resourceSchema)