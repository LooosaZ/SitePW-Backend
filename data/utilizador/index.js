const Utilizador = require("./utilizador");
const UtilizadorController = require("./utilizadorController");
const service = UtilizadorController(Utilizador);

module.exports = service;