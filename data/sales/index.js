const sale = require("./sales");
const salesController = require("./salesController");
const service = salesController(sale);

module.exports = service;