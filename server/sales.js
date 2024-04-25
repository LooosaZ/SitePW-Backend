// This function initializes a sales router for handling sales-related routes.

const bodyParser = require("body-parser");  // Importing body-parser for parsing request bodies
const express = require("express");  // Importing express framework
const Sales = require("../data/sales");  // Importing sales data management functions
const Users = require("../data/users");  // Importing user data management functions
const scopes = require("../data/users/scopes");  // Importing user role scopes

const salesRouter = () => {
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

    // Route for getting all sales
    router.route("/sales")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                Sales.findAll()  // Finding all sales
                    .then((sales) => {
                        console.log('getting all users');  // Logging action
                        res.send(sales);  // Sending response with sales
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);  // Logging error
                        next();  // Proceeding to the next middleware
                    });
            });

    return router;  // Returning the configured router
};

module.exports = salesRouter;  // Exporting the salesRouter function
