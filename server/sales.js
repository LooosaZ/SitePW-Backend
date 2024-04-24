const bodyParser = require("body-parser");
const express = require("express");
const Sales = require("../data/sales");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");

const salesRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.use(function (req, res, next) {
        let token = req.headers["x-access-token"];
        if (!token) {
            return res.status(400).send({auth: false, message: "No token provided"});
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

    router.route("/sales")
        .get(Users.authorize ([scopes["read-all"], scopes["read-posts"]]),
            function (req, res, next) {
                Sales.findAll()
                    .then((sales) => {
                        console.log('getting all users');
                        res.send(sales);
                        next();
                    })
                    .catch((err) => {
                        console.log(err);
                        next();
                    });
            })
        // .post(function (req, res, next) {})
        // .put(function (req, res, next) {})
        // .delete(function (req, res, next) {});

    return router;
};
module.exports = salesRouter;