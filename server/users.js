const bodyParser = require("body-parser");
const express = require("express");
const Users = require("../data/user");

const userRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb"}));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true}));

    router
    .route("/user")
        .get(function (req, res, next) {
            console.log('getting all users');
            Users.findAll()
                .then((user) => {
                    res.send(user);
                    next();
                })
                .catch((err) => {
                    next();
                });
        })
        .post(function (req, res, next) {
            console.log("post");
            let body = req.body;

            Users.create(body)
                .then(() => {
                    console.log("Succesfully created a new user");
                    res.status(200);
                    res.send(body);
                    next();
                })
                .catch((err) => {
                    console.log("Username already in use. Choose another one");
                    res.status(500).send("This username is already in use");
                });
        })
    // .put(function (req, res, next) {})
    // .delete(function (req, res, next) {});

    return router;
}

module.exports = userRouter;