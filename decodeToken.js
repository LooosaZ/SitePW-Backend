const jwt = require('jsonwebtoken');
const config = require('./config'); // Certifique-se de que o caminho para o config.js está correto

const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"]?.split(' ')[1];
  if (!token) {
    console.log("Token não encontrado");
    return res.status(400).send({ auth: false, message: "Sem permissões!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      console.log("Erro na verificação do token:", err);
      return res.status(401).send({ auth: false, message: "Token inválido!" });
    }
    req.username = decoded.username;
    console.log("DECODED->", decoded); // Adicionado para verificar o conteúdo do token decodificado
    next();
  });
};

module.exports = verifyToken;