const nodemailer = require('nodemailer');

// Crie um transporte de e-mail
const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'luzabot.services@outlook.com',
    pass: 'G8mzEHereXM4rhv',
  },
});

async function sendPasswordResetEmail(email, resetToken) {
  const mailOptions = {
    from: 'luzabot.services@outlook.com',
    to: email,
    subject: 'Recuperação de palavra-passe',
    text: `Houve um pedido por parte do cliente para a redefenir a palavra-passe.\nUse o seguinte token temporário para o efeito: ${resetToken}`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail, };