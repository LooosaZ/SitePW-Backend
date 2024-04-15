const Product = require('./product');
const ProductController = require('./productController');

const productController = new ProductController(Product);

module.exports = productController;