const nodemailer = require('nodemailer');
require('dotenv').config();

let mailAuthDisabled = false;

async function sendMail(to, subject, html) {
  if (mailAuthDisabled) {
    return { success: false, disabled: true };
  }

  let transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: `${process.env.ADMIN_EMAIL}`,
      pass: `${process.env.ADMIN_PASS}`,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  let mailOptions = {
    from: `"InpatientSIM" <${process.env.ADMIN_EMAIL}>`,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    if (error && (error.code === "EAUTH" || error.responseCode === 535)) {
      mailAuthDisabled = true;
      console.warn(
        "Email authentication failed. Further outbound emails will be skipped until the mail config is fixed.",
      );
      return { success: false, disabled: true, error };
    }

    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

module.exports = sendMail;
