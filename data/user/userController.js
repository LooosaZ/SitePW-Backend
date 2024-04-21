const User = require("./user");

function userController(UserModel) {
    let controller = {
        create,
        findAll,
        removeById,
        findById,
    };
    // .post method that creates and saves a new user
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


    // .get method to display all users
    function findAll() {
        return new Promise(function (resolve, reject) {
            UserModel.find({})
                .then((users) => resolve(users))
                .catch((err) => reject(err));
        });
    }

    // .() method to find a specific user by its ID
    function findById(id) {
        return new Promise(function (resolve, reject) {
            UserModel.findById(id)
                .then((player) => resolve(player))
                .catch((err) => reject(err));
        });
    }

    //.delete method to delete a specific user by its ID
    function removeById(id) {
        return new Promise(function (resolve, reject) {
            UserModel.findByIdAndDelete(id)
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }
    return controller;
}

module.exports = userController;