require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const adminRoutes = require('./server/routes/admin')
const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/user');
const multer = require('multer')
const path = require('path');
const { v4: uuidv4 } = require('uuid')

const dataBasePassword = process.env.dataBasePassword
const dataBaseUser = process.env.dataBaseUser
const cluster = process.env.cluster

const DB_URI = 'mongodb+srv://' + dataBaseUser + ':' + dataBasePassword + '@' + cluster;

const app = express();
const port = process.env.PORT || 8080

mongoose.set('useFindAndModify', false);

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './images')
    },
    filename: (req, file, cb) => {
        const extension = file.originalname.split('.').pop();
        cb(null, uuidv4() + '.' + extension)
    }
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(bodyParser.json())

app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))

app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.set({
        'Content-Security-Policy': "script-src 'self'"
    })
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(authRoutes);
app.use(adminRoutes);
app.use(userRoutes);

app.use((error, req, res, next) => {
    console.log('errrrr', error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({ message: message })
})

mongoose
    .connect(
        DB_URI,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
    .then(() => app.listen(port))
    .catch(err => console.log(err))