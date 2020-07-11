const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const auth = req.get('Authorization');
    if (!auth) {
        const error = new Error('not authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = auth.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err);
    }
    if (!decodedToken) {
        const error = new Error('not authenticated');
        error.statusCode = 401;
        throw error
    }
    req.userId = decodedToken.userId;
    next();
}