const bodyParser = require("body-parser");
const express = require("express");
const Users = require("../data/users");

const userRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb"}));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true}));

    router.route("/users/get")
        .get(function (req, res, next) {
            console.log('getting all users');
            Users.findAll()
                .then((user) => {
                    res.send(user);
                    next();
                })
                .catch((err) => {
                    console.log(err);
                    next();
                });
        })
        router.route("/users/create")
        .post(function (req, res, next) {
            console.log("post");
            let body = req.body;

            Users.create(body)
                .then(() => {
                    console.log("Successfully created a new users");
                    res.status(200);
                    res.send(body);
                    next();
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).send("This username is already in use");
                });
        })
        router.route("/users/:userID")
            .get(function (req, res, next){
                let userID = req.params.userID;
                console.log(`Finding a user by ID:${userID}`);

                Users.findById(userID)
                    .then((user) => {
                        res.status(200);
                        res.send(user);
                        next();
                    })
                    .catch((err) => {
                        res.status(404);
                        console.log(err);
                        next();
                    });
            })
    // .put(function (req, res, next) {})
        router.route("/users/delete/:userID")
            .delete(function (req, res, next) {
                let userID = req.params.userID;
                console.log(`Deleting user with ID:${userID}`);

            Users.removeById(userID)
             .then(() => {
                 console.log(`Successfully deleted user`)
                 res.status(200)
                     .send(`User ${userID} was Successfully deleted`);
                 next();
             })
             .catch((err) => {
                 console.log(err);
                 res.status(404)
                     .send(`ID:${userID} does not exist`);
                 next();
             });
     });

    return router;
}

module.exports = userRouter;