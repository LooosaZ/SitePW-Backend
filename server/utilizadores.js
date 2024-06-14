const bodyParser = require("body-parser");
const express = require("express");
const Utilizadores = require("../data/utilizador");
const scopes = require("../data/utilizador/scopes");
const bcrypt = require("bcrypt");

const utilizadorRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.use(function (req, res, next) {
        let token = req.headers["x-access-token"] || req.headers["authorization"];
        
        if (token && token.startsWith("Bearer ")) {
            token = token.slice(7, token.length);
        }
    
        console.log("Received token:", token);
    
        if (req.originalUrl && (req.originalUrl.includes('/menu/produtos') && req.method === 'GET')) { 
            next();
        } else {
            if (!token) {
                return res
                    .status(400)
                    .send({ auth: false, message: "Sem permissões!" });
            }
    
            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    console.log("-=> Valid token <=-");
                    console.log("DECODED->" + JSON.stringify(decoded, null, 2));
                    req.roleUser = decoded.role;
                    next();
                })
                .catch((err) => {
                    console.error("Token verification error:", err);
                    res.status(401).send({
                        auth: false,
                        message: "Token inválido!",
                    });
                });
        }
    });    

    router.route("/utilizadores")
        .get(Utilizadores.authorize([scopes["administrador"]]), function (req, res, next) {
            const { sortBy, sortOrder, searchField, searchValue } = req.query;
            const defaultSort = { referencia: 1 };
            const sortOptions = {};
            const filter = {};

            if (sortBy && sortOrder) {
                sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
            }

            if (searchField && searchValue) {
                filter[searchField] = new RegExp(searchValue, "i"); // 'i' para pesquisa insensível a maiúsculas e minúsculas
            }

            Utilizadores.findAll(filter, null)
                .then((utilizadores) => {
                    if (sortBy) {
                        utilizadores.sort((a, b) => {
                            const valueA = a[sortBy];
                            const valueB = b[sortBy];

                            if (
                                typeof valueA === "number" && typeof valueB === "number"
                            ) {
                                return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
                            } else if (
                                typeof valueA === "string" && typeof valueB === "string"
                            ) {
                                return sortOrder === "desc" ? valueB.localeCompare(valueA, "pt", { sensitivity: "base", }) : valueA.localeCompare(valueB, "pt", { sensitivity: "base", });
                            } else if (
                                valueA instanceof Date && valueB instanceof Date
                            ) {
                                return sortOrder === "desc" ? valueB.getTime() - valueA.getTime() : valueA.getTime() - valueB.getTime();
                            } else {
                                return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
                            }
                        });
                    } else {
                        // Se nenhum sortBy for especificado, use a ordenação padrão
                        utilizadores.sort((a, b) => {
                            const valueA = a.username.toLowerCase();
                            const valueB = b.username.toLowerCase();
                            return sortOrder === "desc" ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
                        });
                    }
                    res.send(utilizadores);
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar o stock!"); });
        })
        .post(Utilizadores.authorize([scopes["administrador"]]), function (req, res, next) {
            let body = req.body;

            Utilizadores.findByUsername(body.username)
                .then((verificarUser) => {
                    if (verificarUser) {
                        res.status(400).send("Este username já está em uso. Escolha outro.");
                    } else {
                        Utilizadores.findByEmail(body.email)
                            .then((verificarEmail) => {
                                if (verificarEmail) {
                                    res.status(400).send("Este email já está em uso. Escolha outro.");
                                } else {
                                    for (let scope of body.role.scopes) {
                                        if (!scopes[scope]) {
                                            res.status(400).send("Scope inválido: " + scope);
                                            return;
                                        }
                                    }
                                    delete body.resetToken;
                                    Utilizadores.create(body)
                                        .then(() => {
                                            res.status(200).send(body);
                                        })
                                        .catch((err) => {
                                            res.status(500).send("Ocorreu um erro ao criar o utilizador");
                                        });
                                }
                            })
                            .catch((err) => {
                                res.status(500).send("Ocorreu um erro ao verificar o email");
                            });
                    }
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send(
                        "Ocorreu um erro ao verificar o username"
                    );
                });
        });

    router.route("/utilizadores/:username")
        .get(Utilizadores.authorize([scopes["administrador"]]), function (req, res, next) {
            let username = req.params.username;

            Utilizadores.findByUsername(username)
                .then((utilizador) => { res.status(200).send(utilizador); })
                .catch((err) => { res.status(404).send("Não foi possível encontrar um utilizador com esse username!"); });
        })
        .put(Utilizadores.authorize([scopes["administrador"]]), function (req, res, next) {
            let username = req.params.username;
            let body = req.body;

            Utilizadores.findByUsername(username)
                .then((utilizador) => {
                    if (!utilizador) {
                        res.status(404).send("Não foi possível encontrar um utilizador com esse username!");
                        return;
                    }
                    Utilizadores.findByUsername(body.username)
                        .then((verificarUser) => {
                            if (verificarUser) {
                                res.status(400).send("Este username já está em uso. Escolha outro!");
                            } else {
                                Utilizadores.findByEmail(body.email)
                                    .then((verificarEmail) => {
                                        if (verificarEmail) {
                                            res.status(400).send("Este email já está em uso. Escolha outro!");
                                        } else {
                                            for (let scope of body.role.scopes) {
                                                if (!scopes[scope]) {
                                                    res.status(400).send("Role inválida: " + scope);
                                                    return;
                                                }
                                            }
                                            delete body.password;
                                            delete body.resetToken;
                                            Utilizadores.updateByUsername(
                                                username,
                                                body
                                            )
                                                .then((utilizador) => { res.status(200).send(utilizador); })
                                                .catch((err) => {
                                                    res.status(404).send("Erro ao atualizar o utilizador!");
                                                });
                                        }
                                    })
                                    .catch((err) => {
                                        res.status(500).send("Ocorreu um erro ao verificar o email!");
                                    });
                            }
                        })
                        .catch((err) => {
                            res.status(500).send("Ocorreu um erro ao verificar o username!");
                        });
                })
                .catch((err) => { res.status(500).send("Erro ao procurar o utilizador"); });
        })
        .delete(Utilizadores.authorize([scopes["administrador"]]), function (req, res) {
            let username = req.params.username;

            Utilizadores.findByUsername(username)
                .then((venda) => {
                    if (!venda) {
                        res.status(404).send("Não foi possível encontrar um utilizador com esse username!");
                        return;
                    }
                    Utilizadores.deleteByUsername(username)
                        .then(() => { res.status(200).send("O utilizador foi removido com sucesso."); })
                        .catch((err) => { res.status(500).send("Erro ao remover o utilizador!"); });
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar o utilizador!"); });
        });

    router.route("/utilizador/me")
        .get(Utilizadores.authorize([scopes["administrador"], scopes["gestor"], scopes["utilizador"]]), function (req, res, next) {
            let token = req.headers["x-access-token"];

            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let username = decoded.username;
                    Utilizadores.findByUsername(username)
                        .then((utilizador) => { res.status(200).send(utilizador); })
                        .catch((err) => { res.status(404).send("Não foi possível encontrar um utilizador com esse username!"); });
                })
                .catch(() => { res.status(401).send("Erro ao pesquisar os seus dados!"); });
        })
        .put(Utilizadores.authorize([scopes["administrador"], scopes["gestor"], scopes["utilizador"]]), function (req, res, next) {
            let token = req.headers["x-access-token"];
            let body = req.body;

            Utilizadores.findByUsername(body.username)
                .then((verificarUser) => {
                    if (verificarUser) {
                        res.status(400).send("Este username já está em uso. Escolha outro!");
                    } else {
                        Utilizadores.findByEmail(body.email)
                            .then((verificarEmail) => {
                                if (verificarEmail) {
                                    res.status(400).send("Este email já está em uso. Escolha outro.");
                                } else {
                                    Utilizadores.verifyToken(token).then(
                                        (decoded) => {
                                            let username = decoded.username;
                                            delete body.password;
                                            delete body.resetToken;
                                            delete body.role;
                                            Utilizadores.updateByUsername(
                                                username,
                                                body
                                            )
                                                .then((utilizador) => { res.status(200).send(utilizador); })
                                                .catch((err) => { res.status(404).send("Erro ao atualizar o utilizador!"); });
                                        }
                                    );
                                }
                            })
                            .catch((err) => { res.status(500).send("Ocorreu um erro ao verificar o email"); });
                    }
                })
                .catch((err) => { res.status(500).send("Erro ao procurar o utilizador!"); });
        })
        .delete(Utilizadores.authorize([scopes["administrador"], scopes["gestor"], scopes["utilizador"]]), function (req, res) {
            let token = req.headers["x-access-token"];

            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let username = decoded.username;
                    Utilizadores.deleteByUsername(username)
                        .then(() => { res.status(200).send("Utilizador removido com sucesso"); })
                        .catch((err) => { res.status(500).send("Erro ao remover o utilizador"); });
                })
                .catch(() => { res.status(500).send("Erro ao pesquisar os dados!"); });
        });

    router.put("/utilizador/me/alterar-password", Utilizadores.authorize([scopes["administrador", scopes["gestor"], scopes["utilizador"]]]), function (req, res, next) {
        let token = req.headers["x-access-token"];
        let { passwordAntiga, novaPassword } = req.body;

        Utilizadores.verifyToken(token)
            .then((decoded) => {
                let username = decoded.username;
                Utilizadores.findByUsername(username)
                    .then((utilizador) => {
                        if (!utilizador) {
                            res.status(404).send("Utilizador não encontrado");
                            return;
                        }

                        const isPasswordCorrect = bcrypt.compareSync(
                            passwordAntiga,
                            utilizador.password
                        );
                        if (!isPasswordCorrect) {
                            res.status(400).send("A antiga password está incorreta");
                            return;
                        }

                        const hashedPassword = bcrypt.hashSync(
                            novaPassword,
                            10
                        );

                        Utilizadores.updateByUsername(username, {
                            password: hashedPassword,
                        })
                            .then(() => { res.status(200).send("Password alterada com sucesso"); })
                            .catch((err) => { res.status(500).send("Erro ao atualizar a password"); });
                    })
                    .catch((err) => { res.status(500).send("Erro ao procurar o utilizador"); });
            })
            .catch(() => { res.status(500).send("Erro ao pesquisar os seus dados"); });
    });

    router.route("/utilizador/favoritos")
        .get(function (req, res, next) {
            let token = req.headers["x-access-token"];

            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let username = decoded.username;
                    Utilizadores.findFavorites(username)
                        .then((favoritos) => {
                            res.status(200).send(favoritos);
                        })
                        .catch((err) => {
                            console.error("Erro ao procurar favoritos:", err);
                            res.status(500).send({ message: "Erro ao procurar favoritos do utilizador" });
                        });
                })
                .catch((err) => {
                    res.status(401).send({ message: "Token inválido ou expirado" });
                    console.log(err)
                });
        })
        .put(function (req, res, next) {
            let { referencia, add } = req.body;
            let token = req.headers["x-access-token"];

            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let username = decoded.username;
                    Utilizadores.updateFavorites(username, referencia, add)
                        .then(() => {
                            res.status(200).send({ message: "Favorito atualizado com sucesso" });
                        })
                        .catch((err) => {
                            console.error("Erro ao atualizar favoritos:", err);
                            res.status(500).send({ message: "Erro ao atualizar favoritos" });
                        });
                })
                .catch((err) => {
                    res.status(401).send({ message: "Token inválido ou expirado" });
                    console.log(err)
                });
        });

    router.route("/utilizador/me/fotoPerfil")
        .put(Utilizadores.authorize([scopes["administrador"], scopes["gestor"], scopes["utilizador"]]), function (req, res, next) {
            let token = req.headers["x-access-token"];
            let { image } = req.body;

            if (!image) {
                return res.status(400).send({ error: 'Image is required.' });
            }

            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let username = decoded.username;
                    Utilizadores.updateProfilePicture(username, image)
                        .then((utilizador) => { res.status(200).send({ message: 'Profile picture updated successfully.', utilizador }); })
                        .catch((err) => { res.status(500).send("Erro ao atualizar a foto de perfil!"); });
                })
                .catch((err) => { res.status(401).send("Erro ao pesquisar os seus dados!"); });
        });

    router.route("/utilizador/me/data")
        .get(Utilizadores.authorize([scopes["administrador"], scopes["gestor"], scopes["utilizador"]]), function (req, res, next) {
            let token = req.headers["x-access-token"];

            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let username = decoded.username;
                    Utilizadores.findByUsername(username)
                        .then((utilizador) => {
                            const { username, nome, email, telemovel } = utilizador;
                            res.status(200).send({ username, nome, email, telemovel });
                        })
                        .catch((err) => { res.status(404).send("Não foi possível encontrar um utilizador com esse username!"); });
                })
                .catch(() => { res.status(401).send("Erro ao pesquisar os seus dados!"); });
        });
    return router;
};

module.exports = utilizadorRouter;
