const Product = require('./product');
const ProductController = require('./productController');
const service = new ProductController(Product);

module.exports = service;