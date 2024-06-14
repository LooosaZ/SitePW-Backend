const Stock = require("./stock");
const StockController = require("./stockController");
const service = StockController(Stock);

module.exports = service;