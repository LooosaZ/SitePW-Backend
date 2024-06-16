const config = require("../../config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { request } = require("express");

function utilizadorController(UtilizadorModel) {
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

    function create(utilizador) {
        return createPassword(utilizador).then((hashPassword, err) => {
            if (err) {
                return Promise.reject("A palavra-passe não foi guardada!");
            }

            let newUserWithPassword = {
                ...utilizador,
                password: hashPassword,
            };
            let newUser = new UtilizadorModel(newUserWithPassword);
            return save(newUser);
        });
    }

    function save(model) {
        return new Promise((resolve, reject) => {
            model
                .save()
                .then(() => resolve("O utilizador foi criado com sucesso."))
                .catch((err) => reject(`Existe um problema com a gravação do registo: ${err}`));
        });
    }

    function createToken(utilizador, scopes) {
        let token = jwt.sign(
            {
                username: utilizador.username,
                nome: utilizador.nome,
                role: utilizador.role.scopes,
                scopes: scopes
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
            UtilizadorModel.findOne({ username })
                .then((utilizador) => {
                    if (!utilizador) {
                        return reject("Não foi possível encontrar um utilizador com esse username!");
                    }
                    return comparePassword(password, utilizador.password).then((match) => {
                        if (!match) {
                            return reject("Palavra-passe incorreta!");
                        }
                        return resolve(utilizador);
                    });
                })
                .catch((err) => {
                    reject(`Existe um problema com a gravação do registo: ${err}`);
                });
        });
    }

    function findByEmail(email) {
        return new Promise(function (resolve, reject) {
            UtilizadorModel.findOne({ email })
                .then((utilizador) => resolve(utilizador))
                .catch((err) => reject(err));
        });
    }

    function createPassword(utilizador) {
        return bcrypt.hash(utilizador.password, config.saltRounds)
    }

    function comparePassword(password, hash) {
        return bcrypt.compare(password, hash)
    }

    function authorize(scopes) {
        return (request, response, next) => {
            const { roleUser } = request;
            console.log("Scopes do router: ", scopes);
            console.log("Scopes do utilizador: ", roleUser);

            const hasAuthorization = scopes.some((scope) => roleUser.includes(scope));

            if (roleUser && hasAuthorization) {
                next();
            } else {
                response.status(403).json({ message: "Não tem privilégios suficientes para essa operação!" });
            }
        };
    }

    function findAll(sortOptions) {
        return new Promise(function (resolve, reject) {
            UtilizadorModel.find({})
                .sort(sortOptions)
                .then((utilizadores) => resolve(utilizadores))
                .catch((err) => reject(err));
        });
    }

    function findFavorites(username) {
    return UtilizadorModel.findOne({ username })
        .then((utilizador) => {
            if (!utilizador) {
                throw new Error("Utilizador não encontrado");
            }
            return utilizador.favoritos || []; // Return the favoritos array
        })
        .catch((err) => {
            throw new Error("Erro ao encontrar favoritos do utilizador: " + err.message);
        });
}

    function findByUsername(username) {
        return new Promise(function (resolve, reject) {
            UtilizadorModel.findOne({ username: username })
                .then((utilizador) => resolve(utilizador))
                .catch((err) => reject(err));
        });
    }

    function updateByUsername(username, utilizador) {
        return new Promise(function (resolve, reject) {
            UtilizadorModel.findOneAndUpdate({ username }, utilizador)
                .then(() => resolve(utilizador))
                .catch((err) => reject(err));
        });
    }

    function updateFavorites(username, referencia, add) {
        return new Promise(function (resolve, reject) {
            UtilizadorModel.findOne({ username })
                .then((user) => {
                    if (!user) {
                        throw new Error('Utilizador não encontrado');
                    }
    
                    // Verifique se a referência já está nos favoritos do utilizador
                    const index = user.favoritos.indexOf(referencia);
    
                    // Adicione ou remova a referência dos favoritos do utilizador, dependendo do valor de 'add'
                    if (add) {
                        if (index === -1) {
                            user.favoritos.push(referencia); // Adiciona a referência aos favoritos
                        }
                    } else {
                        if (index !== -1) {
                            user.favoritos.splice(index, 1); // Remove a referência dos favoritos
                        }
                    }
    
                    // Salve as alterações no utilizador
                    return user.save();
                })
                .then(() => resolve({ message: 'Favoritos atualizados com sucesso' }))
                .catch((err) => reject(err));
        });
    }

    function deleteByUsername(username) {
        return new Promise(function (resolve, reject) {
            UtilizadorModel.findOneAndDelete({ username })
                .then((utilizador) => {
                    if (!utilizador) {
                        reject("Não foi possível encontrar um utilizador com esse username!");
                    }
                    resolve();
                })
                .catch((err) => reject(err));
        });
    }

    function findUserByEmail(email) {
        return new Promise(function (resolve, reject) {
            UtilizadorModel.findOne({ email: email })
                .then((utilizador) => resolve(utilizador))
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
        return await UtilizadorModel.findByIdAndUpdate(id, { password: hashedPassword });
    }

    // Método para limpar o token de password de um utilizador
    async function clearResetToken(id) {
        return await UtilizadorModel.findByIdAndUpdate(id, { resetToken: null });
    }

    // Método para atualizar o token de password para um utilizador
    async function updateResetToken(id, resetToken) {
        return await UtilizadorModel.findByIdAndUpdate(id, { resetToken });
    }
    return controller;
}

module.exports = utilizadorController;
