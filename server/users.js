// This function initializes a user router for handling user-related routes.

const bodyParser = require("body-parser");  // Importing body-parser for parsing request bodies
const express = require("express");  // Importing express framework
const Users = require("../data/users");  // Importing user data management functions
const scopes = require("../data/users/scopes");  // Importing user role scopes

const userRouter = () => {
    let router = express();  // Creating an instance of express router

    // Middleware for parsing JSON and URL-encoded request bodies with size limits
    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    // Middleware for verifying JWT token
    router.use(function (req, res, next) {
        let token = req.headers["x-access-token"];  // Extracting token from request headers
        if (!token) {
            return res.status(400).send({ auth: false, message: "No token provided" });  // Sending response if no token provided
        }

        Users.verifyToken(token)  // Verifying the token
            .then((decoded) => {
                console.log("-=> VALID-TOKEN <=-");  // Logging token verification status
                console.log("DECODED -=>" + JSON.stringify(decoded, null, 2));  // Logging decoded token data
                req.roleUser = decoded.role;  // Storing user role in request object
                next();  // Proceeding to the next middleware
            })
            .catch(() => {
                res.status(401).send({ auth: false, message: "Not authorized" });  // Sending response if token verification fails
            });
    });

    // Route for getting all users
    router.route("/users/get")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                Users.findAll()  // Finding all users
                    .then((user) => {
                        console.log('getting all users');  // Logging action
                        res.send(user);  // Sending response with users
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);  // Logging error
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for creating a new user
    router.route("/users/create")
        .post(Users.authorize([scopes["manage-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let body = req.body;  // Extracting request body
                Users.create(body)  // Creating a new user
                    .then(() => {
                        console.log("Successfully created user");  // Logging action
                        res.status(200).send(body);  // Sending response with created user
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(`User already exists ${err}`);  // Logging error
                        err.status = err.status || 500;  // Setting error status
                        res.status(401);  // Setting response status
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for getting a user by ID
    router.route("/users/get/:userID")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let userID = req.params.userID;  // Extracting user ID from request params
                console.log(`Finding a user by ID:${userID}`);  // Logging action
                Users.findById(userID)  // Finding user by ID
                    .then((user) => {
                        res.status(200);  // Setting response status
                        res.send(user);  // Sending response with user
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        res.status(404);  // Setting response status
                        console.log(err);  // Logging error
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for deleting a user by ID
    router.route("/users/delete/:userID")
        .delete(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let userID = req.params.userID;  // Extracting user ID from request params
                console.log(`Deleting user with ID:${userID}`);  // Logging action
                Users.removeById(userID)  // Removing user by ID
                    .then(() => {
                        console.log(`Successfully deleted user`);  // Logging action
                        res.status(200).send(`User ${userID} was Successfully deleted`);  // Sending success response
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);  // Logging error
                        res.status(404).send(`ID:${userID} does not exist`);  // Sending error response
                        next();  // Proceeding to the next middleware
                    });
            });

    return router;  // Returning the configured router
};

module.exports = userRouter;  // Exporting the userRouter function
