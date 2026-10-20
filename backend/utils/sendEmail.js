const emailService = require("../services/emailService");

const sendEmail = async (to, subject, message) => {
    return emailService.sendEmail({
        to,
        subject,
        text: message,
    });
};

module.exports = sendEmail;