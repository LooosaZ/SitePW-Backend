// This function initializes a UserController with CRUD operations and user management operations.

const jwt = require('jsonwebtoken');
const config = require('../../config');
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;


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
        recoverPassword, // Function for password recovery
    };

    // Function for creating a new user with a hashed password
    function create(user) {

        // Creating a hashed password and returning a promise
        return createPassword(user).then((hashPassword, err) => {
            // Handling error if occurred during password hashing
            if (err) {
                return Promise.reject("Not saved");  // Rejecting promise with error message
            }

            // Creating a new user object with hashed password
            let newUserWithPassword = {
                ...user,  // Copying user object properties
                password: hashPassword,  // Assigning hashed password
            };

            // Creating a UserModel instance with the new user object
            let newUser = UserModel(newUserWithPassword);

            // Saving the new user to the database and returning a promise
            return save(newUser);
        })
    }


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

    function recoverPassword(email) {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email })
                .then((user) => {
                    if (!user) {
                        return reject("User not found");
                    }

                    // Generate a password reset token
                    const token = jwt.sign({ id: user._id }, config.secret, { expiresIn: '1h' });

                    // Create a URL for password reset
                    const resetUrl = `http://127.0.0.1:3000/reset-password?token=${token}`;

                    // Load the HTML template for the email
                    fs.readFile(path.resolve(__dirname, '../templates/resetPassword.html'), 'utf8', (err, data) => {
                        if (err) {
                            console.log(err);
                            return reject("Error loading email template");
                        }


                        // Compile the Handlebars template
                        const template = handlebars.compile(data);

                        // Generate the HTML for the email
                        const html = template({ resetUrl });

                        // Create Nodemailer transporter
                        const transporter = nodemailer.createTransport({
                            service: 'outlook',
                            auth: {
                                user: smtpUser,
                                pass: smtpPass
                            }
                        });

                        // Define email options
                        const mailOptions = {
                            from: smtpUser,
                            to: email,
                            subject: 'Password Reset',
                            html: html
                        };

                        // Send the email
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error);
                                return reject("Error sending email");
                            }
                            resolve("Email sent successfully");
                            console.log(`Email sent successfully`);
                        });
                    });
                })
                .catch((err) => {
                    reject(`There was a problem with password recovery ${err}`);
                    console.log(`Error sending email`);
                });
        });
    }

    return controller;  // Return the controller object with all user management functions
}

module.exports = UserController;  // Export the UserController function
