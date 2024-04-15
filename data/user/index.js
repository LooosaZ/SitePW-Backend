const User = require('./user');
const userController = require('./userController');

const service = new userController(User);

module.exports = service;