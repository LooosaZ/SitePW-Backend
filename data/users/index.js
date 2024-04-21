const User = require('./user');
const UserController = require('./userController');
const UsersService = require("./service");

const service = new UserController(User);
const userService = new UsersService(User);

module.exports = service;
module.exports = userService;