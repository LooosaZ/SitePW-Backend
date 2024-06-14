const bodyParser = require("body-parser");
const express = require("express");
const Stocks = require("../data/stock");
const ProdutoController = require("../data/produto");
const Utilizadores = require("../data/utilizador");
const scopes = require("../data/utilizador/scopes");

const stockRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.route("/stock")
        .get(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            const { sortBy, sortOrder, searchField, searchValue } = req.query;
            const defaultSort = { referencia: 1 };
            const sortOptions = {};
            const filter = {};
            if (sortBy && sortOrder) {
                sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
            }

            if (searchField && searchValue) {
                filter[searchField] = new RegExp(searchValue, 'i'); // 'i' para pesquisa insensível a maiúsculas e minúsculas
            }

            Stocks.findAll(filter, null)
                .then((stocks) => {
                    if (sortBy) {
                        stocks.sort((a, b) => {
                            const valueA = a[sortBy];
                            const valueB = b[sortBy];

                            if (typeof valueA === 'number' && typeof valueB === 'number') {
                                return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
                            } else if (typeof valueA === 'string' && typeof valueB === 'string') {
                                return sortOrder === "desc" ? valueB.localeCompare(valueA, 'pt', { sensitivity: 'base' }) : valueA.localeCompare(valueB, 'pt', { sensitivity: 'base' });
                            } else if (valueA instanceof Date && valueB instanceof Date) {
                                return sortOrder === "desc" ? valueB.getTime() - valueA.getTime() : valueA.getTime() - valueB.getTime();
                            } else { return sortOrder === "desc" ? valueB - valueA : valueA - valueB; }
                        });
                    } else { stocks.sort((a, b) => { return defaultSort.referencia === 1 ? a.referencia - b.referencia : b.referencia - a.referencia; }); }
                    res.send(stocks);
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar o stock!"); });
        })
        .post(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let body = req.body;

            ProdutoController.findByRefProduto(body.refProduto)
                .then((produto) => {
                    if (produto) {
                        Stocks.findByReferencia(body.referencia)
                            .then((verificarref) => {
                                if (verificarref) {
                                    res.status(400).send("Essa referência de venda já está em uso, escolha outra!");
                                } else {
                                    Stocks.findByRefProduto(body.refProduto)
                                        .then((verificarStock) => {
                                            if (verificarStock) {
                                                res.status(400).send("Já existe um stock criado com essa referência do produto");
                                            } else {
                                                Stocks.create(body)
                                                    .then(() => { res.status(200).send("Stock adicionado com sucesso."); })
                                                    .catch((err) => { res.status(500).send("Erro ao adicionar stock!"); });
                                            }
                                        })
                                        .catch((err) => { res.status(500).send("Erro ao verificar stock!"); });
                                }
                            })
                            .catch((err) => { res.status(500).send("Erro ao verificar referência!"); });
                    } else { res.status(400).send("Referência de produto não encontrada!"); }
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar referência de produto!"); });
        });

    router.route("/stock/:referencia")
        .get(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let referencia = req.params.referencia;

            Stocks.findByReferencia(referencia)
                .then((stock) => {
                    if (stock) {
                        res.send(stock);
                    } else { res.status(404).send("Não existe nenhum stock com essa referência!"); }
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar stock!"); })
        })
        .put(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let body = req.body;
            let referencia = req.params.referencia;

            Stocks.findByReferencia(referencia)
                .then((stock) => {
                    if (!stock) {
                        res.status(404).send("O ID de stock não foi encontrado!");
                        return;
                    }
                    delete body.referencia; delete body.refProduto;
                    Stocks.updateByReferencia(referencia, body)
                        .then((stock) => { res.status(200).send(stock); })
                        .catch((err) => { res.status(500).send("Erro ao atualizar stock!"); });
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar o stock."); });
        })
        .delete(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]),function (req, res, next) {
            let referencia = req.params.referencia;

            Stocks.findByReferencia(referencia)
                .then((stock) => {
                    if (!stock) {
                        res.status(404).send("O ID de stock não foi encontrado!");
                        return;
                    }
                    Stocks.deleteByReferencia(referencia)
                        .then(() => { res.status(200).send("Stock eliminado com sucesso."); })
                        .catch((err) => { res.status(500).send("Erro ao eliminar stock!"); });
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar o stock!"); });
        });
    return router;
};

module.exports = stockRouter;