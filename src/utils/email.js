const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Your App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log("📧 Sending email to:", to);
  console.log("📝 Subject:", subject);
  console.log("📨 Content:\n", html);
};

module.exports = sendEmail;
