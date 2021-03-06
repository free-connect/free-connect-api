require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const adminRoutes = require('./server/routes/admin')
const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/user');
const helmet = require('helmet');
const compression = require('compression');
const upload = require('./server/util/imageUploadS3')

const dataBasePassword = process.env.MONGO_PASSWORD
const dataBaseUser = process.env.MONGO_USER
const cluster = process.env.MONGO_CLUSTER

const DB_URI = `mongodb+srv://${dataBaseUser}:${dataBasePassword}@${cluster}`;

const app = express();
const port = process.env.PORT || 8080

mongoose.set('useFindAndModify', false);

app.use(upload.single('image'))

function requireHTTPS(req, res, next) {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  }

app.use(requireHTTPS)

app.use(bodyParser.json())

app.use((req, res, next) => {
    res.set({
        'Content-Security-Policy': "script-src 'self', frame-ancestors 'none', X-Content-Type-Options 'nosniff'"
    })
    res.setHeader('Access-Control-Allow-Origin', process.env.APPROVED_URL)
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(authRoutes);
app.use(adminRoutes);
app.use(userRoutes);

app.use(helmet({
    hidePoweredBy: { setTo: 'PHP 4.2.0' }
}));

app.use(compression())

app.use((error, req, res, next) => {
    console.log('Error: ', error);
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