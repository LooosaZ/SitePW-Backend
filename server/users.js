const bodyParser = require("body-parser");
const express = require("express");
const Users = require("../data/users");
const scopes = require("../data/users/scopes");

const userRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb"}));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true}));

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

    router.route("/users/get")
        .get(Users.authorize ([scopes["read-all"], scopes["read-posts"]]),
            function (req, res, next) {
            Users.findAll()
                .then((user) => {
                    console.log('getting all users');
                    res.send(user);
                    next();
                })
                .catch((err) => {
                    console.log(err);
                    next();
                });
        })

        router.route("/users/create")
        .post(Users.authorize([scopes["manage-posts"]]),
            function (req, res, next) {
            let body = req.body;
            Users.create(body)
            .then(() => {
                console.log("Successfully created user");
                res.status(200).send(body);
                next();
                })
                .catch((err) => {
                    console.log(`User already exists ${err}`);
                    err.status = err.status || 500;
                    res.status(401);
                    next();
                });
            });
        router.route("/users/get/:userID")
            .get(Users.authorize ([scopes["read-all"], scopes["read-posts"]]),
                function (req, res, next){
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
        router.route("/users/delete/:userID")
            .delete(Users.authorize ([scopes["read-all"], scopes["read-posts"]]),
                function (req, res, next) {
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