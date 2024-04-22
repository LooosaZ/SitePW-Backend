const jwt = require('jsonwebtoken');
const config = require('../../config');
const bcrypt = require("bcrypt");

function UserController(UserModel) {
    let controller = {
        create,
        findAll,
        removeById,
        findById,
        createToken,
        verifyToken,
        findUser,
        authorize,
    };
    // .post method that creates and saves a new users
    function create(user) {
        return createPassword(user).then((hashPassword, err) => {
            if (err) {
                return Promise.reject("Not saved");
            }

            let newUserWithPassword = {
                ...user,
                password: hashPassword,
            };
            let newUser = UserModel(newUserWithPassword);
            return save(newUser);
        })
    }

    function save(model) {
        return new Promise(function (resolve, reject) {
            model
                .save()
                .then(() => resolve("A new user has been created."))
                .catch((err) => reject(`There was an error with your register ${err}`));
        });
    }

    function createToken(user) {
        let token = jwt.sign(
            {id: user._id, name: user.name, role: user.role.scopes},
            config.secret,
            {
                expiresIn: config.expiresPassword,
            }
        );

        return { auth: true, token };
    }

    function verifyToken(token) {
        return new Promise( (resolve, reject) => {
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    reject();
                }
                return resolve(decoded);
            });
        });
    }

    function findUser ({ name, password }) {
        return new Promise(function (resolve, reject) {
            UserModel.findOne({ name })
                .then((user) => {
                    if (!user) return reject("User not found");
                    return comparePassword(password, user.password).then((match) => {
                        return resolve(user);
                    });
                })
                .catch((err) => {
                    reject(`There was a problem with login ${err}`);
                });
        });
    }
    //returns encrypted password
    function createPassword (user) {
        return bcrypt.hash(user.password, config.saltRounds);
    }

    //checks if sent password matches the encrypted password
    function comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    function authorize(scopes) {
        return (request, response, next) => {
            const { roleUser } = request;
            console.log("Route scopes", scopes);
            console.log("User scopes", roleUser);

            const hasAuthorization = scopes.some((scope) => {
                return roleUser.includes(scope);
            });

            if (roleUser && hasAuthorization) {
                next();
            } else {
                response.status(403).json({ message: "Forbidden"});
            }
        };
    }

    // .get method to display all users
    function findAll() {
        return new Promise(function (resolve, reject) {
            UserModel.find({})
                .then((users) => resolve(users))
                .catch((err) => reject(err));
        });
    }

    // .() method to find a specific users by its ID
    function findById(id) {
        return new Promise(function (resolve, reject) {
            UserModel.findById(id)
                .then((user) => resolve(user))
                .catch((err) => reject(err));
        });
    }

    //.delete method to delete a specific users by its ID
    function removeById(id) {
        return new Promise(function (resolve, reject) {
            UserModel.findByIdAndDelete(id)
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }
    return controller;
}

module.exports = UserController;