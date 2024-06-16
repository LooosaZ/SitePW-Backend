const bodyParser = require("body-parser");
const express = require("express");
const Utilizadores = require("../data/utilizador");
const scopes = require("../data/utilizador/scopes");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const verifyToken = require('../decodeToken');
const Produtos = require("../data/produto");

const utilizadorRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.use(function (req, res, next) {
        const token = req.headers["x-access-token"]?.split(' ')[1];
        console.log("tocano->" + token);


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
            console.log("Body of the request:", body);

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
            .then((utilizador) => { res.status(200).send(utilizador) })
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
                    if (body.role && body.role.nome === 'administrador') {
                        body.role.scopes = ['administrador'];
                    } else if (body.role && body.role.nome !== 'administrador') {
                        body.role.scopes = ['utilizador'];
                    if (!scopes[body.role.nome]) {
                      res.status(400).send("Role inválida: " + body.role.nome);
                      return;
                    }
                  }

                  delete body.password;
                  delete body.resetToken;
                  Utilizadores.updateByUsername(username, body)
                    .then((utilizador) => { res.status(200).send(utilizador); })
                    .catch((err) => {
                      res.status(404).send("Erro ao atualizar o utilizador!");
                      console.log(err)
                    });
                }
              })
              .catch((err) => {
                res.status(500).send("Ocorreu um erro ao verificar o email!");
                console.log(err);
              });
          }
        })
        .catch((err) => {
          res.status(500).send("Ocorreu um erro ao verificar o username!");
          console.log("verify username");
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
        .get(verifyToken, (req, res, next) => {
            const username = req.username;

            Utilizadores.findByUsername(username)
                .then((utilizador) => {
                    res.status(200).send(utilizador);
                })
                .catch((err) => {
                    res.status(404).send("Não foi possível encontrar um utilizador com esse username!");
                });
        })
        .put(verifyToken, async (req, res, next) => {
            try {
                const body = req.body;
                const username = req.username;

                // Verificar se o novo username já está em uso
                const verificarUser = await Utilizadores.findByUsername(body.username);
                if (verificarUser && verificarUser.username !== username) {
                    return res.status(400).send("Este username já está em uso. Escolha outro!");
                }

                // Verificar se o novo email já está em uso
                const verificarEmail = await Utilizadores.findByEmail(body.email);
                if (verificarEmail && verificarEmail.email !== username) {
                    return res.status(400).send("Este email já está em uso. Escolha outro.");
                }

                delete body.password;
                delete body.resetToken;
                delete body.role;

                // Buscar o utilizador pelo nome de utilizador original
                const utilizador = await Utilizadores.findByUsername(username);
                if (!utilizador) {
                    return res.status(404).send("Utilizador não encontrado");
                }

                const originalUsername = utilizador.username;

                // Atualizar os dados do utilizador
                await Utilizadores.updateByUsername(username, body);

                // Verificar se o username foi alterado
                if (body.username && body.username !== originalUsername) {
                    // Username foi alterado, é necessário fazer logout
                    return res.status(200).send({ message: "Username updated, please log in again", logout: true });
                }

                res.status(200).send(utilizador);
            } catch (err) {
                console.error("Erro ao atualizar o utilizador:", err);
                res.status(500).send("Erro ao atualizar o utilizador!");
            }
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

    router.route("/utilizador/me/alterar-password").put(
        verifyToken,
        Utilizadores.authorize([scopes.administrador, scopes.gestor, scopes.utilizador]),
        async function (req, res, next) {
            try {
                let { passwordAntiga, novaPassword } = req.body;
                let username = req.username;

                const utilizador = await Utilizadores.findByUsername(username);

                if (!utilizador) {
                    return res.status(404).json({ message: "Utilizador não encontrado" });
                }

                const isPasswordCorrect = bcrypt.compareSync(passwordAntiga, utilizador.password);
                if (!isPasswordCorrect) {
                    return res.status(400).json({ message: "A antiga password está incorreta" });
                }

                const hashedPassword = bcrypt.hashSync(novaPassword, 10);

                await Utilizadores.updateByUsername(username, { password: hashedPassword });

                return res.status(200).json({ message: "Password alterada com sucesso" });
            } catch (err) {
                console.error("Erro ao alterar a password:", err);
                return res.status(500).json({ message: "Erro ao alterar a password" });
            }
        }
    );


    router.route("/utilizador/favoritos")
        .get(verifyToken, (req, res, next) => {
            let username = req.username;
            Utilizadores.findFavorites(username)
                .then((favoritos) => {
                    res.status(200).send(favoritos);
                })
                .catch((err) => {
                    console.error("Erro ao procurar favoritos:", err);
                    res.status(500).send({ message: "Erro ao procurar favoritos do utilizador" });
                });
        })
        .put(verifyToken, (req, res) => {
            const { referencia, add } = req.body;

            Utilizadores.updateFavorites(req.username, referencia, add)
                .then(result => res.status(200).send(result))
                .catch(err => {
                    console.error("Erro ao atualizar favoritos:", err);
                    res.status(500).send({ message: "Erro ao atualizar favoritos" });
                });
        });

    router.get('/utilizador/filtrarfavoritos', verifyToken, async (req, res) => {
        try {
            const username = req.username;
            const favoriteReferences = await Utilizadores.findFavorites(username);

            if (favoriteReferences.length === 0) {
                return res.json([]); // Retorna um array vazio se não houver favoritos
            }

            // Usando Promise.all para buscar cada produto individualmente
            const favoriteProducts = await Promise.all(
                favoriteReferences.map(async (reference) => {
                    const product = await Produtos.findByreferencia(reference); // Passa apenas o valor da referência
                    return product;
                })
            );

            res.json(favoriteProducts.filter(product => product !== null)); // Filtrar produtos nulos
        } catch (err) {
            console.error('Error fetching favorite products:', err);
            res.status(500).send('Erro ao obter os produtos favoritos');
        }
    });

    router.route("/utilizador/me/profile-picture")
        .put(verifyToken, async (req, res, next) => {
            try {
                const { profilePicture } = req.body;
                const username = req.username;

                const updatedUtilizador = await Utilizadores.updateProfilePicture(username, profilePicture);
                res.status(200).send(updatedUtilizador);
            } catch (err) {
                res.status(500).send("Erro ao atualizar a foto de perfil do utilizador");
            }
        });

        router.route("/utilizador/:username/profile-picture")
        .put( async (req, res, next) => {
            try {
                const body = req.body;
                let username = req.params.username;

                // Verificar se o novo username já está em uso
                const verificarUser = await Utilizadores.findByUsername(body.username);
                if (verificarUser && verificarUser.username !== username) {
                    return res.status(400).send("Este username já está em uso. Escolha outro!");
                }

                delete body.password;
                delete body.resetToken;
                delete body.role;

                // Buscar o utilizador pelo nome de utilizador original
                const utilizador = await Utilizadores.findByUsername(username);
                if (!utilizador) {
                    return res.status(404).send("Utilizador não encontrado");
                }

                const originalUsername = utilizador.username;

                // Atualizar os dados do utilizador
                await Utilizadores.updateByUsername(username, body);

                // Verificar se o username foi alterado
                if (body.username && body.username !== originalUsername) {
                    // Username foi alterado, é necessário fazer logout
                    return res.status(200).send({ message: "Username updated, please log in again", logout: true });
                }

                res.status(200).send(utilizador);
            } catch (err) {
                console.error("Erro ao atualizar o utilizador:", err);
                res.status(500).send("Erro ao atualizar o utilizador!");
            }
        })

    return router;
};

module.exports = utilizadorRouter;
