const Stock = require('./stock');
const StockController = require('./stockController');

const service = new StockController(Stock);

module.exports = service;

