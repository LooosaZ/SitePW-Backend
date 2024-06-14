const Venda = require("./venda");
const VendaController = require("./vendaController");
const service = VendaController(Venda);

module.exports = service;