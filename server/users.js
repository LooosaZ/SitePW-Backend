const bodyParser = require("body-parser");
const express = require("express");
const users = require("../data/user/user");

const userRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb"}));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true}));

    router
    .route("users")
    .get(function (req, res, next) {})
    .post(function (rep, res, next) {})
    .put(function (req, res, next) {})
    .delete(function (req, res, next) {});

    return router;
}

module.exports = userRouter;