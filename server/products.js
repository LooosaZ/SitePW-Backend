const bodyParser = require("body-parser");
const express = require("express");
const Products = require("../data/product");

const productRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router
        .route("/product")
        .get(function (req, res, next) {})
        .post(function (req, res, next) {})
        .put(function (req, res, next) {})
        .delete(function (req, res, next) {});

    return router;
};
module.exports = productRouter;
