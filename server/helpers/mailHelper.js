const nodemailer = require('nodemailer');
require('dotenv').config();
async function sendMail(to, subject, html) {

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587, 
    secure: false, 
    auth: {
      user: `${process.env.ADMIN_EMAIL}`, 
      pass: `${process.env.ADMIN_PASS}`,
    },
  });

  let mailOptions = {
    from: `"InsightXR" <${process.env.ADMIN_EMAIL}>`,
    to: to,
    subject: subject,
    html: html, 
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }m
}

module.exports = sendMail;
