// This function initializes a UserController with CRUD operations and user management operations.

const jwt = require('jsonwebtoken');  // Importing JSON Web Token module
const config = require('../../config');  // Importing configuration settings
const bcrypt = require("bcrypt");  // Importing bcrypt for password hashing

function UserController(UserModel) {
    // Object to hold controller functions
    let controller = {
        create,          // Function to create a new user
        findAll,         // Function to find all users
        removeById,      // Function to remove a user by its ID
        findById,        // Function to find a user by its ID
        createToken,     // Function to create a JWT token for user authentication
        verifyToken,     // Function to verify a JWT token
        findUser,        // Function to find a user by name and password
        authorize,       // Function to authorize user access based on roles
    };

    // Function to create a new user
    function create(user) {
        // Create password hash and save user
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

    // Function to save a user
    function save(model) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            model
                .save()  // Save the user to the database
                .then(() => resolve("A new user has been created."))  // Resolve if successful
                .catch((err) => reject(`There was an error with your register ${err}`));  // Reject if an error occurs
        });
    }

    // Function to create a JWT token for user authentication
    function createToken(user) {
        let token = jwt.sign(
            {id: user._id, name: user.name, role: user.role.scopes},  // Payload containing user information
            config.secret,  // Secret key for token generation
            {
                expiresIn: config.expiresPassword,  // Token expiration time
            }
        );

        return { auth: true, token };  // Return token for authentication
    }

    // Function to verify a JWT token
    function verifyToken(token) {
        // Return a promise for asynchronous handling
        return new Promise( (resolve, reject) => {
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    reject();  // Reject if token verification fails
                }
                return resolve(decoded);  // Resolve with decoded token data
            });
        });
    }

    // Function to find a user by name and password
    function findUser({ name, password }) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            UserModel.findOne({ name })  // Find user by name
                .then((user) => {
                    if (!user) return reject("User not found");  // Reject if user not found
                    return comparePassword(password, user.password).then((match) => {
                        return resolve(user);  // Resolve with user if password matches
                    });
                })
                .catch((err) => {
                    reject(`There was a problem with login ${err}`);  // Reject if an error occurs
                });
        });
    }

    // Function to hash user password
    function createPassword(user) {
        return bcrypt.hash(user.password, config.saltRounds);  // Hash user password
    }

    // Function to compare password with hashed password
    function comparePassword(password, hash) {
        return bcrypt.compare(password, hash);  // Compare password with hash
    }

    // Function to authorize user access based on roles
    function authorize(scopes) {
        return (req, res, next) => {
            const { roleUser } = req;
            console.log("Route scopes", scopes);
            console.log("User scopes", roleUser);

            const hasAuthorization = scopes.some((scopes) => {
                return roleUser.includes(scopes);
            })

            if (roleUser && hasAuthorization) {
                next();  // Proceed to the next middleware if authorized
            } else {
                res.status(403).json({ message: "Forbidden"});  // Respond with Forbidden status if not authorized
            }
        };
    }

    // Function to find all users
    function findAll() {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            UserModel.find({})  // Find all users
                .then((users) => resolve(users))  // Resolve with the found users
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to find a user by its ID
    function findById(id) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            UserModel.findById(id)  // Find user by ID
                .then((user) => resolve(user))  // Resolve with the found user
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to remove a user by its ID
    function removeById(id) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            UserModel.findByIdAndDelete(id)  // Find and delete user by ID
                .then(() => resolve())  // Resolve if successful
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    return controller;  // Return the controller object with all user management functions
}

module.exports = UserController;  // Export the UserController function
