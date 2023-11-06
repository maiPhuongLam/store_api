import * as nodemailer from 'nodemailer';
import configuration from 'src/config/configuration';

export const sendMail = async (
  email: string,
  subject: string,
  body: string,
) => {
  const transporter = await nodemailer.createTransport({
    service: 'gmail',
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'maiphuonglambh.2002@gmail.com',
      pass: configuration().passEmailGoogle,
    },
  });
  const mailOptions = {
    from: 'KING_CODE <446df79f0f-82456a@inbox.mailtrap.io>',
    to: email,
    subject,
    html: body,
  };
  await transporter.sendMail(mailOptions);
};
