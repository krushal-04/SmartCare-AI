const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, message) => {

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message
    });

};

module.exports = sendEmail;