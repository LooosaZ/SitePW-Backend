const User = require("./user");

function userController(UserModel) {
    let controller = {
        create,
        findAll
    };

    function create(values) {
        let newUser = UserModel(values);
        return save(newUser);
    }

    function save(newUser){
        return new Promise(function (resolve, reject){
            newUser
                .save()
                .then(() => resolve("A new user has been created."))
                .catch((err) => reject(err));
        });
    }

    function findAll() {
        return new Promise(function (resolve, reject) {
            UserModel.find({})
                .then((users) => resolve(users))
                .catch((err) => reject(err));
        });
    }

    return controller;
}

module.exports = userController;