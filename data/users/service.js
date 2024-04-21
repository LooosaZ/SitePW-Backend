const config = require('../../config');
const jwt = require('jsonwebtoken');
function UserService(UserModel) {
    let service = {
        create,
        createToken,
        verifyToken,
    };

    function create(user) {
        let newUser = new UserModel(user);
        return save(newUser);
    }

    function save(model) {
        return new Promise(function (resolve, reject) {
            model
                .save()
                .then(() => resolve("A new user has been created."))
                .catch((err) => reject(`There was an error with your register ${err}`));
        });
    }

    function createToken(user) {
        let token = jwt.sign(
            {id: user._id, name: user.name},
            config.secret,
            {
                expiresIn: config.expiresPassword,
            }
        );

        return { auth: true, token };
    }

    function verifyToken(token) {
        return new Promise( (resolve, reject) => {
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    reject();
                }
                return resolve(decoded);
            });
        });
    }
    return service;
}

module.exports = UserService;