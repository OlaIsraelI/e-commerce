const nodemailer = require("nodemailer");

const fromAddress = process.env.EMAIL_USER || process.env.EMAIL_FROM;

const transporter = process.env.GOOGLE_CLIENT_ID
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: fromAddress,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    })
  : nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

module.exports = async (to, subject, text) => {
  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
  });
};
