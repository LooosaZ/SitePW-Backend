// This function initializes a stock router for handling stock-related routes.

const bodyParser = require("body-parser");  // Importing body-parser for parsing request bodies
const express = require("express");  // Importing express framework
const Stocks = require("../data/stock");  // Importing stock data management functions
const Users = require("../data/users");  // Importing user data management functions
const scopes = require("../data/users/scopes");  // Importing user role scopes

const stockRouter = () => {
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

    // Route for getting all stocks
    router.route("/getall")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                Stocks.findAll()  // Finding all stocks
                    .then((stock) => {
                        console.log('Getting stock contents');  // Logging action
                        res.send(stock);  // Sending response with stocks
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(`Error detected: ${err}`);
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for getting a stock by ID
    router.route("/get/:stockID")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let stockID = req.params.stockID;  // Extracting stock ID from request params
                console.log(`Finding stock by ID:${stockID}`);  // Logging action

                Stocks.findById(stockID)  // Finding stock by ID
                    .then((stock) => {
                        res.status(200);  // Setting response status
                        res.send(stock);  // Sending response with stock
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        res.status(404);  // Setting response status
                        console.log(err);  // Logging error
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for creating a new stock
    router.route("/create")
        .post(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                console.log("Creating stock");  // Logging action
                let body = req.body;  // Extracting request body

                Stocks.create(body)  // Creating a new stock
                    .then(() => {
                        console.log("Successfully created Stock");  // Logging action
                        res.status(200);  // Setting response status
                        res.send(body);  // Sending response with created stock
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(`error detected: ${err}`);  // Logging error
                        res.status(500).send("An error has been detected, check console for more information.");  // Sending error response
                    });
            })
    // .put(function (req, res, next) {})  // Route for updating a stock
    // .delete(function (req, res, next) {});  // Route for deleting a stock

    // Route for deleting a stock by ID
    router.route("/delete/:stockID")
        .delete(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let stockID = req.params.stockID;  // Extracting stock ID from request params
                console.log(`Deleting user with ID:${stockID}`);  // Logging action

                Stocks.removeById(stockID)  // Removing stock by ID
                    .then(() => {
                        console.log(`Successfully deleted stock`);  // Logging action
                        res.status(200);  // Setting response status
                        res.send(`Stock ${stockID} was Successfully deleted`);  // Sending success response
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);  // Logging error
                        res.status(404).send(`ID:${stockID} does not exist`);  // Sending error response
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for tracking a stock by ID
    router.route("/track/:stockID")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let stockID = req.params.stockID;  // Extracting stock ID from request params
                Stocks.trackingById(stockID)  // Tracking stock by ID
                    .then((stock) => {
                        console.log(`tracking ${stockID}`);  // Logging action
                        res.send(stock);  // Sending response with tracked stock
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(`Error detected: ${err}`);
                        next();  // Proceeding to the next middleware
                    });
            });

    return router;  // Returning the configured router
};

module.exports = stockRouter;  // Exporting the stockRouter function
