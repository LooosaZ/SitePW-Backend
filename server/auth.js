const bodyParser = require('body-parser');
const express = require('express');
const Users = require('../data/users');
const {response} = require("express");

function AuthRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb"}));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true}));

    router.route("/register")
        .post(function (req, res, next) {
            const body = req.body;
            console.log("User: ". body);
            Users.create(body)
                .then(() => Users.create(body))
                .then((response) => {
                    res.status(200);
                    console.log("User token:", response);
                    res.send(response);
                })
                .catch((err) => {
                    res.status(500).send(err);
                    next();
                });
        });
    router.route("/me")
        .get(function (req, res, next) {
            let token = req.headers['x-access-token'];

            if(!token) {
                return res.status(401).send({auth: false, message: "No token provided"});
            }

            return Users.verifyToken(token)
                .then((decoded) => {
                    console.log(decoded);
                    res.status(202).send({auth: true, token: decoded});
                })
                .catch((err) => {
                    res.status(500).send(err);
                    next();
                });
        });

    return router;
}

module.exports = AuthRouter;