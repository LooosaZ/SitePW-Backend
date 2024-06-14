const config = require("../../config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { request } = require("express");

function userController(UserModel) {
    let controller = {
        create,
        findAll,
        findByUsername,
        updateByUsername,
        deleteByUsername,
        createToken,
        verifyToken,
        findUser,
        createPassword,
        comparePassword,
        authorize,
        findUserByEmail,
        generateResetToken,
        updatePassword,
        clearResetToken,
        updateResetToken,
        findByEmail,
        findFavorites,
        updateFavorites
    };

    function create(user) {
        return createPassword(user).then((hashPassword, err) => {
            if (err) {
                return Promise.reject("Password not saved.");
            }

            let newUserWithPassword = {
                ...user,
                password: hashPassword,
            };
            let newUser = new UserModel(newUserWithPassword);
            return save(newUser);
        });
    }

    function save(model) {
        return new Promise((resolve, reject) => {
            model
                .save()
                .then(() => resolve("A new user was successfully created."))
                .catch((err) => reject(`There was a problem while creating a new user: ${err}`));
        });
    }

    function createToken(user) {
        let token = jwt.sign(
            {
                username: user.username,
                nome: user.nome,
                role: user.role.scopes,
            },
            config.secret,
            {
                expiresIn: config.expiresPassword,
            }
        );
        return { auth: true, token }
    }

    function verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    reject();
                }
                return resolve(decoded);
            });
        });
    }

    function findUser({ username, password }) {
        return new Promise(function (resolve, reject) {
            UserModel.findOne({ username })
                .then((user) => {
                    if (!user) {
                        return reject("There is no user with this name!");
                    }
                    return comparePassword(password, user.password).then((match) => {
                        if (!match) {
                            return reject("Password is incorrect");
                        }
                        return resolve(user);
                    });
                })
                .catch((err) => {
                    reject(`An error occurred while trying to findUser: ${err}`);
                });
        });
    }

    function findByEmail(email) {
        return new Promise(function (resolve, reject) {
            UserModel.findOne({ email })
                .then((user) => resolve(user))
                .catch((err) => reject(err));
        });
    }

    function createPassword(user) {
        return bcrypt.hash(user.password, config.saltRounds)
    }

    function comparePassword(password, hash) {
        return bcrypt.compare(password, hash)
    }

    function authorize(scopes) {
        return (request, response, next) => {
            const { roleUser } = request;
            console.log("Router Scopes: ", scopes);
            console.log("User Scopes: ", roleUser);

            const hasAuthorization = scopes.some((scope) => roleUser.includes(scope));

            if (roleUser && hasAuthorization) {
                next();
            } else {
                response.status(403).json({ message: "Forbidden, not authorized" });
            }
        };
    }

    function findAll(sortOptions) {
        return new Promise(function (resolve, reject) {
            UserModel.find({})
                .sort(sortOptions)
                .then((users) => resolve(users))
                .catch((err) => reject(err));
        });
    }

    function findFavorites(username) {
        return UserModel.findOne({ username })
            .then((user) => {
                if (!user) {
                    throw new Error("User not found.");
                }
                return user.token;
            })
            .catch((err) => {
                throw new Error("An error occurred while trying to find user favorites: " + err.message);
            });
    }

    function findByUsername(username) {
        return new Promise(function (resolve, reject) {
            UserModel.findOne({ username: username })
                .then((user) => resolve(user))
                .catch((err) => reject(err));
        });
    }

    function updateByUsername(username, user) {
        return new Promise(function (resolve, reject) {
            UserModel.findOneAndUpdate({ username }, user)
                .then(() => resolve(user))
                .catch((err) => reject(err));
        });
    }

    function updateFavorites(username, referencia, add) {
        return new Promise(function (resolve, reject) {
            userModel.findOne({ username })
                .then((user) => {
                    if (!user) {
                        throw new Error('User not found.');
                    }

                    // Verifique se a referência já está nos favoritos do usuário
                    const index = user.favoritos.indexOf(referencia);

                    // Adicione ou remova a referência dos favoritos do usuário, dependendo do valor de 'add'
                    if (add) {
                        if (index === -1) {
                            user.favoritos.push(referencia); // Adiciona a referência aos favoritos
                        }
                    } else {
                        if (index !== -1) {
                            user.favoritos.splice(index, 1); // Remove a referência dos favoritos
                        }
                    }

                    // Salve as alterações no usuário
                    return user.save();
                })
                .then(() => resolve({ message: 'Favorites updated successfully.' }))
                .catch((err) => reject(err));
        });
    }

    function deleteByUsername(username) {
        return new Promise(function (resolve, reject) {
            UserModel.findOneAndDelete({ username })
                .then((user) => {
                    if (!user) {
                        reject("There is no user with this name.");
                    }
                    resolve();
                })
                .catch((err) => reject(err));
        });
    }

    function findUserByEmail(email) {
        return new Promise(function (resolve, reject) {
            UserModel.findOne({ email: email })
                .then((user) => resolve(user))
                .catch((err) => reject(err));
        });
    }

    function generateResetToken() {
        // Implemente a lógica para gerar um token único
        // Por exemplo, podemos usar bibliotecas como `uuid`
        const token = Math.random().toString(36).substr(2); // Gera uma string aleatória para a construção de um token
        return token;
    }

    async function updatePassword(id, novaPassword) {
        const hashedPassword = await bcrypt.hash(novaPassword, 10);
        return await UserModel.findByIdAndUpdate(id, { password: hashedPassword });
    }

    // Método para limpar o token de password de um user
    async function clearResetToken(id) {
        return await UserModel.findByIdAndUpdate(id, { resetToken: null });
    }

    // Método para atualizar o token de password para um user
    async function updateResetToken(id, resetToken) {
        return await UserModel.findByIdAndUpdate(id, { resetToken });
    }
    return controller;
}

module.exports = userController;
