const User = require('./user');
const UserController = require('./userController');

const service = new UserController(User);

module.exports = service;
