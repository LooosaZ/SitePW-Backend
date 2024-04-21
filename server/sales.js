const bodyParser = require("body-parser");
const express = require("express");
const Sales = require("../data/sales");

const salesRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router
        .route("/sales")
        .get(function (req, res, next) {
            console.log("Test");
            res.send("test");
            next();
        })
        .post(function (req, res, next) {})
        .put(function (req, res, next) {})
        .delete(function (req, res, next) {});

    return router;
};
module.exports = salesRouter;