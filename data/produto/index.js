const Produto = require("./produto");
const ProdutoController = require("./produtoController");
const service = ProdutoController(Produto);

module.exports = service;