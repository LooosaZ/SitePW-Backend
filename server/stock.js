const bodyParser = require("body-parser");
const express = require("express");
const Stocks = require("../data/stock");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");


const stockRouter = () => {
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

    router.route("/getall")
        .get(Users.authorize ([scopes["read-all"], scopes["read-posts"]]),
            function (req, res, next) {
            Stocks.findAll()
                .then((stock) => {
                    console.log('Getting stock contents');
                    res.send(stock);
                    next();
                })
                .catch((err) => {
                    next();
                });
        })
    router.route("/get/:stockID")
        .get(function (req, res, next){
            let stockID = req.params.stockID;
            console.log(`Finding stock by ID:${stockID}`);

            Stocks.findById(stockID)
                .then((stock) => {
                    res.status(200);
                    res.send(stock);
                    next();
                })
                .catch((err) => {
                    res.status(404);
                    console.log(err);
                    next();
                });
        })
    router.route("/create")
        .post(function (req, res, next) {
            console.log("Creating stock");
            let body = req.body;

            Stocks.create(body)
                .then(() => {
                    console.log("Successfully created Stock");
                    res.status(200);
                    res.send(body);
                    next();
                })
                .catch((err) => {
                    console.log(`error detected: ${err}`);
                    res.status(500).send("An error has been detected, check console for more information.");
                });
        })
        .put(function (req, res, next) {

        })
    router.route("/delete/:stockID")
        .delete(function (req, res, next) {
            let stockID = req.params.stockID;
            console.log(`Deleting user with ID:${stockID}`);

                Stocks.removeById(stockID)
                    .then(() => {
                        console.log(`Successfully deleted stock`)
                        res.status(200)
                            .send(`Stock ${stockID} was Successfully deleted`);
                        next();
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(404)
                            .send(`ID:${stockID} does not exist`);
                        next();
                    });
            });

    return router;
};

module.exports = stockRouter;
