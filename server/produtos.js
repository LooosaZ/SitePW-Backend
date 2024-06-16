const bodyParser = require("body-parser");
const express = require("express");
const Produtos = require("../data/produto");
const Utilizadores = require("../data/utilizador");
const scopes = require("../data/utilizador/scopes");
const Stock = require("../data/stock");

const produtoRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router
        .route("/produtos")
        .get(async function (req, res, next) {
            const {
                sortBy,
                sortOrder,
                searchField,
                searchValue,
                minPrice,
                maxPrice,
                stockStatus,
                favoritesOnly
            } = req.query;
        
            console.log("Parâmetros recebidos:", req.query);
        
            const defaultSort = { referencia: 1 };
            const sortOptions = {};
            const filter = {};
        
            if (sortBy && sortOrder) {
                sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
            }
        
            if (searchField && searchValue) {
                filter[searchField] = new RegExp(searchValue, "i");
            }
        
            if (minPrice !== undefined && maxPrice !== undefined) {
                filter.preco = {
                    $gte: parseFloat(minPrice),
                    $lte: parseFloat(maxPrice),
                };
            }
        
            try {
                let produtos = await Produtos.findAll(filter, null);
        
                const promises = produtos.map(async (produto) => {
                    const stock = await Stock.findByRefProduto(produto.referencia);
                    if (stock) {
                        produto.stock = {
                            quantidade: stock.quantidade,
                            data: stock.data,
                            anotacoes: stock.anotacoes,
                        };
                    } else {
                        produto.stock = {
                            quantidade: 0,
                            anotacoes: "Não foi possível encontrar nenhuma associação do produto a pelo menos um stock!",
                        };
                    }
                });
        
                await Promise.all(promises);
        
                if (stockStatus === 'inStock') {
                    produtos = produtos.filter(produto => produto.stock && produto.stock.quantidade > 0);
                } else if (stockStatus === 'outOfStock') {
                    produtos = produtos.filter(produto => !produto.stock || produto.stock.quantidade <= 0);
                }
        
                if (sortBy) {
                    produtos.sort((a, b) => {
                        const valueA = a[sortBy];
                        const valueB = b[sortBy];
        
                        if (typeof valueA === "number" && typeof valueB === "number") {
                            return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
                        } else if (typeof valueA === "string" && typeof valueB === "string") {
                            return sortOrder === "desc" ? valueB.localeCompare(valueA, "pt", { sensitivity: "base" }) : valueA.localeCompare(valueB, "pt", { sensitivity: "base" });
                        } else {
                            return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
                        }
                    });
                } else {
                    produtos.sort((a, b) => {
                        return defaultSort.referencia === 1 ? a.referencia - b.referencia : b.referencia - a.referencia;
                    });
                }
        
                res.send(produtos);
            } catch (err) {
                res.status(500).send("Erro ao procurar os produtos!");
            }
        })
        .post(
            Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]),
            function (req, res, next) {
                let body = req.body;

                if (
                    !body ||
                    !body.referencia ||
                    !body.nome ||
                    !body.descricao ||
                    !body.preco ||
                    !body.categoria
                ) {
                    res.status(400).send(
                        "Solicitação inválida! Certifique-se de fornecer todos os campos obrigatórios:"
                    );
                    return;
                }
                Produtos.findByreferencia(body.referencia).then((produto) => {
                    if (produto) {
                        res.status(500).send(
                            "Essa referência já existe, tente outra!"
                        );
                        return;
                    }
                    Produtos.create(body)
                        .then(() => {
                            res.status(200).send(body);
                        })
                        .catch((err) => {
                            res.status(500).send(
                                "Erro ao adicionar o produto!"
                            );
                        });
                });
            }
        );

    router
        .route("/produtos/:referencia")
        .get(async function (req, res, next) {
            let referencia = req.params.referencia;

            try {
                const produto = await Produtos.findByreferencia(referencia);
                if (!produto) {
                    res.status(404).send("Não foi possível encontrar um produto com essa referência!");
                    return;
                }

                // Fetch the stock associated with the product
                const stock = await Stock.findByRefProduto(referencia);
                if (stock) {
                    produto.stock = {
                        quantidade: stock.quantidade,
                        data: stock.data,
                        anotacoes: stock.anotacoes,
                    };
                } else {
                    produto.stock = {
                        anotacoes: "Não foi possível encontrar nenhuma associação do produto a pelo menos um stock!",
                    };
                }

                res.status(200).send(produto);
            } catch (err) {
                res.status(500).send("Erro ao procurar o produto!");
                console.log(err);
            }
        })
        .put(
            Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]),
            function (req, res, next) {
                let referencia = req.params.referencia;
                let body = req.body;

                Produtos.findByreferencia(referencia)
                    .then((produto) => {
                        if (!produto) {
                            res.status(404).send(
                                "Não foi possível encontrar um produto com essa referência!"
                            );
                            return;
                        }
                        delete body.referencia;
                        Produtos.update(referencia, body)
                            .then((produto) => {
                                res.status(200).send(produto);
                            })
                            .catch((err) => {
                                res.status(500).send(
                                    "Erro ao atualizar o produto!"
                                );
                            });
                    })
                    .catch((err) => {
                        res.status(500).send("Erro ao procurar o produto!");
                    });
            }
        )
        .delete(
            Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]),
            function (req, res) {
                let referencia = req.params.referencia;

                Produtos.findByreferencia(referencia)
                    .then((produto) => {
                        if (!produto) {
                            res.status(404).send(
                                "Não foi possível encontrar um produto com essa referência!"
                            );
                            return;
                        }
                        try {
                            Stock.removeByReferencia(referencia);
                            Produtos.removeByreferencia(referencia);
                            res.status(200).send(
                                "Produto e stock removidos com sucesso!"
                            );
                        } catch (err) {
                            res.status(500).send(
                                "Erro ao eliminar o produto e stock!"
                            );
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).send("Erro ao procurar o produto!");
                    });
            }
        );

        router.route("/produtos/:referencia/imagem")
    .put(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), async (req, res) => {
        try {
            const { imagem } = req.body;
            const referencia = req.params.referencia;

            // Update the product's image
            const updatedProduto = await Produtos.updateImage(referencia, imagem);
            res.status(200).send(updatedProduto);
        } catch (err) {
            res.status(500).send("Erro ao atualizar a imagem do produto");
        }
    });
    return router;
};
module.exports = produtoRouter;
