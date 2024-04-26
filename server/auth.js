// This function initializes an authentication router for handling user registration, authentication, and token verification.

const bodyParser = require('body-parser');  // Importing body-parser for parsing request bodies
const express = require('express');  // Importing express framework
const Users = require('../data/users');  // Importing user data management functions

function AuthRouter() {
    let router = express();  // Creating an instance of express router

    // Middleware for parsing JSON and URL-encoded request bodies with size limits
    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    // Route for user registration
    router.route("/register")
        .post(function (req, res, next) {
            const body = req.body;  // Extracting request body
            console.log("User:", body);  // Logging user information
            Users.create(body)  // Creating a new user
                .then(() => Users.createToken(body))  // Creating JWT token for the user
                .then((response) => {
                    res.status(200);  // Setting response status
                    console.log("User token:", response);  // Logging user token
                    res.send(response);  // Sending token in response
                })
                .catch((err) => {
                    res.status(500).send(err);  // Sending error response if any error occurs
                    next();  // Proceeding to the next middleware
                });
        });

    // Route for getting user information
    router.route("/me")
        .get(function (req, res, next) {
            let token = req.headers['x-access-token'];  // Extracting token from request headers

            if (!token) {
                return res.status(401).send({ auth: false, message: "No token provided" });  // Sending response if no token provided
            }

            return Users.verifyToken(token)  // Verifying the token
                .then((decoded) => {
                    console.log(decoded);  // Logging decoded token data
                    res.status(202).send({ auth: true, token: decoded });  // Sending response with token data
                })
                .catch((err) => {
                    res.status(500).send(err);  // Sending error response if token verification fails
                    next();  // Proceeding to the next middleware
                });
        });

    // Route for user login
    router.route("/login")
        .post(function (req, res, next) {
            let body = req.body;  // Extracting request body
            console.log("Login for user:", body);  // Logging login information
            return Users.findUser(body)  // Finding user based on login credentials
                .then((user) => {
                    return Users.createToken(user);  // Creating JWT token for the user
                })
                .then((response) => {
                    res.status(200).send(response);  // Sending token in response
                })
                .catch((err) => {
                    res.status(500).send(err);  // Sending error response if login fails
                    next();  // Proceeding to the next middleware
                });
        });

    router.route("/users/recover-password")
        .post(function (req, res, next) {
            const { email } = req.body;
            Users.recoverPassword(email)
                .then((message) => {
                    res.status(200).send(message); // Respond with success message
                })
                .catch((err) => {
                    res.status(400).send(err); // Respond with error message
                });
        });

    return router;  // Returning the configured router
}

module.exports = AuthRouter;  // Exporting the AuthRouter function
