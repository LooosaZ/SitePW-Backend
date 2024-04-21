const bodyParser = require("body-parser");
const express = require("express");
const Stock = require("../data/stock");
const Users = require("../data/users");

const stockRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.route("/getall")
        .get(function (req, res, next) {
            console.log('Getting stock contents');
            Stock.findAll()
                .then((stock) => {
                    res.send(stock);
                    next();
                })
                .catch((err) => {
                    next();
                });
        })
    router.route("/:stockID")
        .get(function (req, res, next){
            let stockID = req.params.stockID;
            console.log(`Finding stock by ID:${stockID}`);

            Users.findById(stockID)
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

            Stock.create(body)
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

                Stock.removeById(stockID)
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
