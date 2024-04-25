// This function initializes a product router for handling product-related routes.

const bodyParser = require("body-parser");  // Importing body-parser for parsing request bodies
const express = require("express");  // Importing express framework
const Products = require("../data/product");  // Importing product data management functions
const Users = require("../data/users");  // Importing user data management functions
const scopes = require("../data/users/scopes");  // Importing user role scopes

const productRouter = () => {
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

    // Route for getting all products
    router.route("/get")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                Products.findAll()  // Finding all products
                    .then((product) => {
                        console.log('getting all users');  // Logging action
                        res.send(product);  // Sending response with products
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);  // Logging error
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for adding a new product
    router.route("/add")
        .post(Users.authorize([scopes["read-all"], scopes["manage-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let body = req.body;  // Extracting request body
                Products.create(body)  // Creating a new product
                    .then(() => {
                        console.log("Successfully added new product");  // Logging action
                        res.status(200).send(body);  // Sending success response
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(`Product already exists ${err}`);  // Logging error
                        err.status = err.status || 500;  // Setting status code
                        res.status(401);  // Setting response status
                        next();  // Proceeding to the next middleware
                    });
            });

    // Route for deleting a product by ID
    router.route("/delete/:productID")
        .delete(Users.authorize([scopes["read-all"], scopes["manage-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let productID = req.params.productID;  // Extracting product ID from request params
                Products.removeById(productID)  // Removing product by ID
                    .then(() => {
                        console.log(`Deleting Product with ID:${productID}`);  // Logging action
                        res.status(200).send(`Deleting Product with ID:${productID}`);  // Sending success response
                        next();  // Proceeding to the next middleware
                    })
                    .catch((err) => {
                        console.log(err);  // Logging error
                        res.status(404).send(`ID:${productID} does not exist`);  // Sending error response
                        next();  // Proceeding to the next middleware
                    })
            });

    // Route for modifying a product by ID
    router.route("/modify/:productID")
        .post(Users.authorize([scopes["read-all"], scopes["manage-posts"]]),  // Authorizing access based on user role scopes
            function (req, res, next) {
                let productID = req.params.productID;  // Extracting product ID from request params
                let newData = req.body;  // Extracting new data from request body
                Products.modifyByID(productID, newData)  // Modifying product by ID
                    .then(() => {
                        console.log(`Successfully modify product with ID:${productID}`);  // Logging action
                        res.status(200).send(`Product ${productID} was successfully modified`);  // Sending success response
                        next();  // Proceeding to the next middleware
                    })
            });

    return router;  // Returning the configured router
};

module.exports = productRouter;  // Exporting the productRouter function
