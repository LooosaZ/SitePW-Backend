const bodyParser = require("body-parser");
const express = require("express");
const Products = require("../data/product");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");

const productRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.use(function (req, res, next) {
        let token = req.headers["x-access-token"];
        if (!token) {
            return res
                .status(400)
                .send({auth: false, message: "No token provided"});
        }

        Users.verifyToken(token)
            .then((decoded) => {
                console.log("-=> VALID-TOKEN <=-");
                console.log("DECODED -=>" + JSON.stringify(decoded, null, 2));
                req.roleUser = decoded.role;
                next();
            })
            .catch(() => {
                res.status(401).send({auth: false, message: "Not authorized"});
            });
    });

    router.route("/get")
        .get(Users.authorize([scopes["read-all"], scopes["read-posts"]]),
            function (req, res, next) {
                Products.findAll()
                    .then((product) => {
                        console.log('getting all users');
                        res.send(product);
                        next();
                    })
                    .catch((err) => {
                        console.log(err);
                        next();
                    });
            })

    router.route("/add")
        .post(Users.authorize([scopes["read-all"], scopes["manage-posts"]]),
            function (req, res, next) {
                let body = req.body;
                Products.create(body)
                    .then(() => {
                        console.log("Successfully added new product");
                        res.status(200).send(body);
                        next();
                    })
                    .catch((err) => {
                        console.log(`Product already exists ${err}`);
                        err.status = err.status || 500;
                        res.status(401);
                        next();
                    });
            });

    router.route("/delete/:productID")
        .delete(Users.authorize([scopes["read-all"], scopes["manage-posts"]]),
            function (req, res, next) {
                let productID = req.params.productID;
                Products.removeById(productID)
                    .then(() => {
                        console.log(`Deleting Product with ID:${productID}`);
                        res.status(200)
                            .send(`Deleting Product with ID:${productID}`);
                        next();
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(404)
                            .send(`ID:${productID} does not exist`);
                        next();
                    })
            })

    // router.route("/modify/:productID")
    //     .post(Users.authorize([scopes["read-all"], scopes["manage-posts"]]),
    //         function (req, res, next) {
    //             let productID = req.params.productID;
    //             let newData = req.body;
    //             Products.modifyByID()
    //                 .then(() => {
    //                     console.log(`Successfully modify product with ID:${productID}`);
    //                     res.status(200).send(`Product ${newData} was successfully modified`);
    //                 })
    //         })

    return router;
};


module.exports = productRouter;
