const nodemailer = require('nodemailer');

//send email with attachment options using nodemailer
const sendEmail = async (options) => {
  //create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  //define email options
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,

    };

    //attach file to email

    if (options.attachment) {
      mailOptions.attachments = [
        {
          filename: options.filename,
          path: options.attachment,
        },
      ];
    }

    //send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
