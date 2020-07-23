const nodemailer = require('nodemailer')

//for production

const mailOptions = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.USER_PW
    }
}

//for testing

// const mailOptions = {
//     host: "smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//         user: process.env.TEST_USERNAME,
//         pass: process.env.TEST_USER_PW
//     }
//   };

const transport = nodemailer.createTransport(mailOptions)

async function handleMail(message) {
    return new Promise((resolve, reject) => {
        transport.sendMail(message, (err, info) => {
            if (err) {
                const error = new Error("Hmm something went wrong. Please try again!");
                error.statusCode = 401;
                console.log(err)
                reject(error)
            } else {
                resolve(true)
            }
        });
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            throw err
        })
}

const sendMail = async (info) => {
    try {
        let resp = await handleMail(info);
        return resp;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        throw err
    }
}

module.exports = sendMail;