const bodyParser = require("body-parser");
const express = require("express");
const Vendas = require("../data/venda");
const Utilizadores = require("../data/utilizador");
const scopes = require("../data/utilizador/scopes");
const StockController = require("../data/stock");
const Produto = require("../data/produto");

const vendasRouter = () => {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.route("/vendas")
        .get(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            const { sortBy, sortOrder, searchField, searchValue } = req.query;
            const defaultSort = { nrVenda: 1 };
            const sortOptions = {};
            const filter = {};

            if (sortBy && sortOrder) { sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1; }

            if (searchField && searchValue) { filter[searchField] = new RegExp(searchValue, "i"); }

            Vendas.findAll(filter, null)
                .then((vendas) => {
                    if (sortBy) {
                        vendas.sort((a, b) => {
                            const valueA = a[sortBy];
                            const valueB = b[sortBy];

                            if (
                                typeof valueA === "number" && typeof valueB === "number"
                            ) {
                                return sortOrder === "desc"
                                    ? valueB - valueA
                                    : valueA - valueB;
                            } else if (
                                typeof valueA === "string" && typeof valueB === "string"
                            ) {
                                return sortOrder === "desc"
                                    ? valueB.localeCompare(valueA, "pt", { sensitivity: "base", })
                                    : valueA.localeCompare(valueB, "pt", { sensitivity: "base", });
                            } else if (
                                valueA instanceof Date && valueB instanceof Date
                            ) {
                                return sortOrder === "desc"
                                    ? valueB.getTime() - valueA.getTime()
                                    : valueA.getTime() - valueB.getTime();
                            } else {
                                return sortOrder === "desc"
                                    ? valueB - valueA
                                    : valueA - valueB;
                            }
                        });
                    } else {
                        vendas.sort((a, b) => {
                            return defaultSort.nrVenda === 1
                                ? a.nrVenda - b.nrVenda
                                : b.nrVenda - a.nrVenda;
                        });
                    }

                    res.send(vendas);
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar os produtos!"); });
        })
        //codigo otimizado
        .post(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let body = req.body;
            let venda = req.body;

            Vendas.findByNrVenda(body.nrVenda)
                .then((vendaExistente) => {
                    if (vendaExistente) {
                        res.status(500).send("Esse nº venda já existe, escolha outro!");
                        return;
                    }

                    Promise.all(venda.produtos.map((produto) => StockController.findByRefProduto(produto.ref)))
                        .then((produtosEncontrados) => {
                            for (let i = 0; i < produtosEncontrados.length; i++) {
                                if (!produtosEncontrados[i]) {
                                    res.status(400).send("Não existe stock para esta referência do produto " + venda.produtos[i].ref);
                                    return;
                                }
                            }

                            let totalVenda = 0;
                            let produtosValidos = true;
                            Promise.all(venda.produtos.map(async (produto) => {
                                try {
                                    const refProduto = produto.ref;
                                    const produtoEncontrado = await Produto.findByRefProduto(refProduto);
                                    const quantidadeStock = await StockController.findByRefProduto(refProduto);

                                    if (!produtoEncontrado) { res.status(400).send("Produto não foi encontrado com a referência: " + produto.ref); } else {
                                        produto.nome = produtoEncontrado.nome;
                                        produto.preco = produtoEncontrado.preco;

                                        if (quantidadeStock.quantidade < produto.quantidade) {
                                            res.status(400).send("Não há stock suficiente para o produto " + produto.ref);
                                            produtosValidos = false;
                                        }
                                        totalVenda += produto.preco * produto.quantidade;
                                    }
                                } catch (error) { res.status(500).send("Erro ao pesquisar a venda"); }
                            })
                            )
                                .then(() => {
                                    if (!produtosValidos) { return; }

                                    Promise.all(venda.produtos.map(async (produto) => {
                                        const refProduto = produto.ref;
                                        const quantidadeStock = await StockController.findByRefProduto(refProduto);
                                        quantidadeStock.quantidade -= produto.quantidade;
                                        return quantidadeStock.save();
                                    }))
                                        .then(() => {
                                            const token = req.headers["x-access-token"];
                                            Utilizadores.verifyToken(token)
                                                .then((decoded) => {
                                                    const username = decoded.username;
                                                    Utilizadores.findByUsername(username)
                                                        .then((user) => {
                                                            venda.total = totalVenda;
                                                            venda.estado = "no carrinho";
                                                            venda.cliente = {
                                                                usernameUtilizador: user.username,
                                                                nomeUtilizador: user.nome,
                                                                contactoUtilizador: user.telemovel,
                                                            };

                                                            Vendas.create(venda)
                                                                .then(() => {
                                                                    console.log("Venda criada com sucesso!");
                                                                    res.status(200).send(venda);
                                                                })
                                                                .catch(
                                                                    (error) => {
                                                                        res.status(400).send(error.message || "Erro ao criar a venda, tente novamente!");
                                                                    }
                                                                );
                                                        })
                                                        .catch((error) => { res.status(400).send("Erro ao procurar o utilizador"); });
                                                })
                                                .catch((error) => { res.status(400).send("Erro ao verificar o token"); });
                                        })
                                        .catch((error) => { res.status(400).send("Erro ao atualizar o stock"); });
                                })
                                .catch((error) => { res.status(400).send("Erro ao processar os produtos"); });
                        })
                        .catch((error) => { res.status(400).send("Erro ao procurar produtos"); });
                })
                .catch((error) => { res.status(400).send("Erro ao verificar a venda existente"); });
        });

    /*//codigo original
.post(async function (req, res, next) {
    console.log("post");
    let body = req.body;
    let venda = req.body;
    let vendaExistente = await Vendas.findByNrVenda(body.nrVenda);

    if (vendaExistente) {
        console.log("Esse nº venda já existe, escolha outro!");
        res.status(500).send("Esse nº venda já existe, escolha outro!");
        return;
    }

    // Verificar se todos os produtos existem
    for (let produto of venda.produtos) {
        let produtoEncontrado = await StockController.findByRefProduto(produto.ref);
        if (!produtoEncontrado) {
            console.error("Não existe stock para esta referência do produto " + produto.ref);
            res.status(400).send("Não existe stock para esta referência do produto " + produto.ref);
            return;
        }
    }
    let totalVenda = 0;
    let produtosValidos = true;
    for (let produto of venda.produtos) {
        try {
            // Busque o produto pelo ref
            const refProduto = produto.ref;
            const produtoEncontrado = await Produto.findByRefProduto(refProduto);
            const quantidadeStock = await StockController.findByRefProduto(refProduto);

            if (!produtoEncontrado) {
                console.error("Produto não foi encontrado para a referência: " + produto.ref);
                res.status(400).send("Erro ao pesquisar a venda");
            } else {
                // Atribua o nome e o preço do produto encontrado ao produto na venda
                produto.nome = produtoEncontrado.nome;
                produto.preco = produtoEncontrado.preco;

                if (quantidadeStock.quantidade < produto.quantidade) {
                    console.error("Não há stock suficiente para o produto " + produto.nome);
                    res.status(400).send("Não há stock suficiente para o produto " + produto.nome);
                    produtosValidos = false; // Defina como falso se houver um problema com o stock
                    break;
                }
                console.log(quantidadeStock.quantidade, produto.quantidade);

                totalVenda += produto.preco * produto.quantidade;
            }
        } catch (error) {
            console.log("Erro ao procurar o produto:", error);
            res.status(500).send("Erro ao pesquisar a venda");
        }
    }

    if (!produtosValidos) {
        return;
    }

    try {
        //     const token = req.headers.authorization.split(' ')[1]; // Assume que o token está no cabeçalho Authorization
        for (let produto of venda.produtos) {
            const refProduto = produto.ref;
            const quantidadeStock = await StockController.findByRefProduto(refProduto);
            quantidadeStock.quantidade -= produto.quantidade;
            quantidadeStock.save();
        }

        let token = req.headers["x-access-token"];
        const decoded = await Utilizadores.verifyToken(token);
        const username = decoded.username;
        const user = await Utilizadores.findByUsername(username);
        venda.total = totalVenda;
        venda.estado = "no carrinho"

        // Adicione o nome do utilizador à venda
        venda.cliente = {
            usernameUtilizador: user.username,
            nomeUtilizador: user.nome,
            contactoUtilizador: user.telemovel
        };

        // Crie a venda
        await Vendas.create(venda);
        console.log("Venda criada com sucesso!");
        res.status(200).send(venda);
    } catch (error) {
        console.error("Erro ao criar a venda:", error.message);
        res.status(400).send(error.message || "Erro ao criar a venda, tente novamente!");
    }
});

/*
Vendas.findByNrVenda(body.nrVenda)
.then((venda) => {
    if (venda) {
        console.log("Esse nº venda já existe, escolha outro!");
        res.status(500).send("Esse nº venda já existe, escolha outro!");
        return;
    } else {
        for (let scope of body.produtos.ref) {
            ProdutoController.findByRefProduto(body.produtos.ref)
                .then((produto) => {
                    if (!produto[scope]) {
                        res.status(400).send("Scope inválido: " + scope);
                        return;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).send("Erro ao pesquisar referência de produto!");
                });
            Vendas.create(body)
                .then(() => {
                    console.log("Venda criada com sucesso!");
                    res.status(200);
                    res.send(body);
                })
                .catch((err) => {
                    console.log("Erro ao criar a venda!");
                    res.status(500).send("Erro, tente novamente!");
                    /*
            } else {
                console.log("Referência de produto não encontrada!");
                res.status(400).send("Referência de produto não encontrada!");
            }
        
                })
                .catch((err) => {
                    console.log("Erro, tente novamente!");
                    res.status(500).send("Erro, tente novamente!");
                });
        }
    }
})
.catch((err) => {
    console.log(err);
    res.status(500).send("Erro ao pesquisar a venda");
});
});*/

    router.route("/vendas/:nrVenda")
        .get(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let nrVenda = req.params.nrVenda;
            Vendas.findByNrVenda(nrVenda)
                .then((venda) => { res.status(200).send(venda); })
                .catch((err) => { res.status(404).send("Venda não foi encontrada"); });
        })
        .put(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let nrVenda = req.params.nrVenda;
            let updatedVenda = req.body;

            Vendas.findByNrVenda(nrVenda)
                .then((venda) => {
                    if (!venda) {
                        res.status(404).send("Venda não encontrada");
                        return;
                    }

                    if (venda.estado !== "no carrinho") {
                        res.status(400).send("Não é possível adicionar produtos a uma venda que não está no carrinho");
                        return;
                    }
                    /*
                                               if (!produtoAtualizado.quantidade && produtoOriginal) {
                                                   
                                                   // Produto removido da venda, adicionando a quantidade original de volta ao stock
                                                   return StockController.updateStock(produto.ref, produtoOriginal.quantidade);
                                               }*/
                    Promise.all(updatedVenda.produtos.map(async (produto) => {
                        const produtoAtualizado = produto;
                        const produtoOriginal = venda.produtos.find(prod => prod.ref === produtoAtualizado.ref);

                        if (!produtoOriginal) {
                            venda.produtos.push(produtoAtualizado);
                            return StockController.updateStock(produtoAtualizado.ref, produtoAtualizado.quantidade);
                        }

                        const diffQuantidade = produtoAtualizado.quantidade - (produtoOriginal ? produtoOriginal.quantidade : 0);
                        if (diffQuantidade !== 0) { return StockController.updateStock(produto.ref, diffQuantidade); }

                        if (produtoAtualizado.quantidade === 0) { return StockController.updateStock(produto.ref, produtoOriginal.quantidade - produtoAtualizado.quantidade); }

                        return Promise.resolve();
                    })
                    )
                        .then(() => {
                            Promise.all(updatedVenda.produtos.map(async (produtoAtualizado) => {
                                const produto = await Produto.findByRefProduto(produtoAtualizado.ref);
                                if (produto) { produtoAtualizado.nome = produto.nome; produtoAtualizado.preco = produto.preco; }
                            }))
                                .then(() => {
                                    let totalVenda = 0;
                                    updatedVenda.produtos.forEach((produtoAtualizado) => {
                                        totalVenda += produtoAtualizado.preco * produtoAtualizado.quantidade;
                                    });

                                    venda.produtos = updatedVenda.produtos;
                                    updatedVenda.total = totalVenda;
                                    venda.total = totalVenda;
                                    delete updatedVenda.estado;

                                    Vendas.update(nrVenda, updatedVenda)
                                        .then(() => {
                                            console.log("Venda atualizada com sucesso!");
                                            res.status(200).send(venda);
                                        })
                                })
                                .catch((error) => { res.status(500).send("Erro ao atualizar a venda"); });
                        })
                        .catch((error) => {
                            console.error("Erro ao atualizar a venda:", error);
                            res.status(500).send("Erro ao procurar os dados atualizados dos produtos");
                        });
                })
                .catch((error) => { res.status(500).send("Erro ao procurar a venda"); })
        })
        .delete(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res) {
            let nrVenda = req.params.nrVenda;

            Vendas.findByNrVenda(nrVenda)
                .then((venda) => {
                    if (!venda) {
                        res.status(404).send("Venda não encontrada");
                        return;
                    }
                    Vendas.removeByNrVenda(nrVenda)
                        .then(() => { res.status(200).send("Venda removida com sucesso"); })
                        .catch((err) => { res.status(500).send("Erro ao remover a venda"); });
                })
                .catch((err) => { res.status(500).send("Erro ao pesquisar a venda"); });
        });

    router.route("/venda/me")
        .get(Utilizadores.authorize([scopes["utilizador"], scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let token = req.headers["x-access-token"];

            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let usernameUtilizador = decoded.username;
                    Vendas.findByUsername(usernameUtilizador)
                        .then((venda) => { 
                            res.status(200).send(venda); 
                        })
                        .catch((err) => { 
                            res.status(404).send("Venda não foi encontrada"); 
                        });
                })
                .catch((err) => { 
                    res.status(500).send("Erro ao verificar o token"); 
                });
        });
        router.route("/venda/me/:nrVenda")
        .put(Utilizadores.authorize([scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
            let updatedVenda = req.body;
            let token = req.headers["x-access-token"];
            let nrVenda = req.params.nrVenda;
        
            Utilizadores.verifyToken(token)
                .then((decoded) => {
                    let usernameUtilizador = decoded.username;
                    Vendas.findByNrVendaAndUsername(nrVenda, usernameUtilizador)
                        .then((venda) => {
                            if (!venda) {
                                res.status(404).send("Venda não encontrada");
                                return;
                            }
        
                            if (venda.estado !== "no carrinho") {
                                res.status(400).send("Não é possível adicionar produtos a uma venda que não está no carrinho");
                                return;
                            }
        
                            Promise.all(updatedVenda.produtos.map(async (produto) => {
                                const produtoAtualizado = produto;
                                const produtoOriginal = venda.produtos.find(prod => prod.ref === produtoAtualizado.ref);
        
                                if (!produtoOriginal) {
                                    venda.produtos.push(produtoAtualizado);
                                    return StockController.updateStock(produtoAtualizado.ref, produtoAtualizado.quantidade);
                                }
        
                                const diffQuantidade = produtoAtualizado.quantidade - (produtoOriginal ? produtoOriginal.quantidade : 0);
                                if (diffQuantidade !== 0) { return StockController.updateStock(produto.ref, diffQuantidade); }
        
                                if (produtoAtualizado.quantidade === 0) { return StockController.updateStock(produto.ref, produtoOriginal.quantidade - produtoAtualizado.quantidade); }
        
                                return Promise.resolve();
                            }))
                            .then(() => {
                                Promise.all(updatedVenda.produtos.map(async (produtoAtualizado) => {
                                    const produto = await Produto.findByRefProduto(produtoAtualizado.ref);
                                    if (produto) { produtoAtualizado.nome = produto.nome; produtoAtualizado.preco = produto.preco; }
                                }))
                                .then(() => {
                                    let totalVenda = 0;
                                    updatedVenda.produtos.forEach((produtoAtualizado) => {
                                        totalVenda += produtoAtualizado.preco * produtoAtualizado.quantidade;
                                    });
        
                                    venda.produtos = updatedVenda.produtos;
                                    venda.total = totalVenda;
        
                                    Vendas.update(nrVenda, updatedVenda)
                                        .then(() => {
                                            console.log("Venda atualizada com sucesso!");
                                            res.status(200).send(venda);
                                        })
                                        .catch((error) => { res.status(500).send("Erro ao atualizar a venda"); });
                                })
                                .catch((error) => {
                                    console.error("Erro ao procurar os dados atualizados dos produtos:", error);
                                    res.status(500).send("Erro ao procurar os dados atualizados dos produtos");
                                });
                            })
                            .catch((error) => {
                                console.error("Erro ao atualizar a venda:", error);
                                res.status(500).send("Erro ao atualizar a venda");
                            });
                        })
                        .catch((error) => {
                            console.error("Erro ao procurar a venda:", error);
                            res.status(500).send("Erro ao procurar a venda");
                        });
                })
                .catch((error) => {
                    console.error("Erro ao verificar o token:", error);
                    res.status(500).send("Erro ao verificar o token");
                });
        });


    return router;
};
module.exports = vendasRouter;
