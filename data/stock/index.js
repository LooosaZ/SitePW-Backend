const Stock = require('./stock');
const StockController = require('./stockController');

const stockController = new stockController(Stock);

module.exports = StockController;

