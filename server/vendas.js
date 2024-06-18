const bodyParser = require("body-parser");
const express = require("express");
const Vendas = require("../data/venda");
const Utilizadores = require("../data/utilizador");
const scopes = require("../data/utilizador/scopes");
const StockController = require("../data/stock");
const Produto = require("../data/produto");
const verifyToken = require("../decodeToken");
const VendaModel = require("../data/venda/venda")

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

    // router.route("/venda/me")
    //     .get(Utilizadores.authorize([scopes["utilizador"], scopes["administrador"], scopes["gestor"]]), function (req, res, next) {
    //         let token = req.headers["x-access-token"];

    //         Utilizadores.verifyToken(token)
    //             .then((decoded) => {
    //                 let usernameUtilizador = decoded.username;
    //                 console.log("a"+usernameUtilizador)
    //                 Vendas.findByUsername(usernameUtilizador)
    //                     .then((venda) => { 
    //                         res.status(200).send(venda); 
    //                     })
    //                     .catch((err) => { 
    //                         res.status(404).send("Venda não foi encontrada"); 
    //                         console.log(err)
    //                     });
    //             })
    //             .catch((err) => { 
    //                 res.status(500).send("Erro ao verificar o token");
    //                 console.log(err) 
    //             });
    //     });
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
    /*router.route("/venda/me")
            .get(Utilizadores.authorize([scopes["utilizador"], scopes["administrador"], scopes["gestor"]]), verifyToken, function (req, res, next) {
    
                        let usernameUtilizador = req.username;
                        Vendas.findByUsername(usernameUtilizador)
                            .then((venda) => { 
                                res.status(200).send(venda); 
                            })
                            .catch((err) => { 
                                res.status(404).send("Venda não foi encontrada"); 
                            });
            })*/
    router.route("/venda/me")
        .get(Utilizadores.authorize([scopes["utilizador"], scopes["administrador"], scopes["gestor"]]), verifyToken, function (req, res, next) {

            let usernameUtilizador = req.username;
            Vendas.findCarrinho(usernameUtilizador)
                .then((venda) => {
                    res.status(200).send(venda);
                })
                .catch((err) => {
                    res.status(404).send("Venda não foi encontrada");
                });
        })
        .post(Utilizadores.authorize([scopes["administrador"], scopes["utilizador"]]), verifyToken, async function (req, res, next) {
            try {
                const vendaRequest = req.body;

                // Verificar a existência de stock para todos os produtos
                const produtoStock = await StockController.findByRefProduto(vendaRequest.referencia);

                if (!produtoStock) {
                    return res.status(400).send(`Não existe stock para a referência do produto ${vendaRequest.referencia}.`);
                }

                // Verificar se há stock suficiente
                if (produtoStock.quantidade < vendaRequest.quantity) {
                    return res.status(400).send(`Não há stock suficiente para o produto ${vendaRequest.referencia}.`);
                }

                const produtoEncontrado = await Produto.findByRefProduto(vendaRequest.referencia);
                // Calcular o total da venda
                let totalVenda = 0;
                if (produtoEncontrado && produtoEncontrado.preco && vendaRequest.quantity) {
                    totalVenda = produtoEncontrado.preco * parseInt(vendaRequest.quantity);
                    totalVenda = totalVenda.toFixed(2);
                } else {
                    return res.status(400).send(`Dados de entrada inválidos para calcular o total da venda.`);
                }

                // Atualizar a quantidade de stock
                //   produtoEncontrado.quantidade -= vendaRequest.quantity;
                //     await produtoEncontrado.save();

                const user = req.username;
                const nome = req.nome;
                const contacto = req.contacto;

                // Gerar o número de venda único (autoincremento manual)
                const novoNrVenda = await Vendas.gerarAutoIncremental();
                // Criar a nova venda
                const novaVenda = new VendaModel({
                    nrVenda: novoNrVenda,
                    cliente: {
                        usernameUtilizador: user,
                        nomeUtilizador: nome,
                        contactoUtilizador: contacto,
                    },
                    produtos: [{
                        ref: vendaRequest.referencia,
                        nome: produtoEncontrado.nome,
                        preco: produtoEncontrado.preco,
                        quantidade: vendaRequest.quantity,
                        imagem: produtoEncontrado.imagem,
                    }],
                    total: totalVenda,
                    estado: "no carrinho",

                });

                console.log(novaVenda);

                //      Vendas.create(novaVenda);
                //   console.log("Venda criada com sucesso!");
                await novaVenda.save();
                console.log('Venda criada com sucesso:', novaVenda);

                res.status(200).json(novaVenda);

            } catch (error) {
                console.error(error);
                res.status(500).send("Erro ao processar a venda. Por favor, tente novamente.");
            }
        })
        .put(Utilizadores.authorize([scopes["administrador"], scopes["utilizador"], scopes["gestor"]]), verifyToken, async function (req, res, next) {
            try {
                const { nrVenda, produtos } = req.body;

                // Buscar a venda existente pelo nrVenda
                const vendaExistente = await VendaModel.findOne({ nrVenda });
                if (!vendaExistente) {
                    return res.status(404).send(`Venda com o número ${nrVenda} não encontrada.`);
                }

                let totalAdicional = 0;

                for (let produto of produtos) {
                    // Verificar a existência de stock para cada produto
                    const produtoStock = await StockController.findByRefProduto(produto.refProduto);
                    if (!produtoStock) {
                        return res.status(400).send(`Não existe stock para a referência do produto ${produto.refProduto}.`);
                    }

                    // Verificar se há stock suficiente
                    if (produtoStock.quantidade < produto.quantity) {
                        return res.status(400).send(`Não há stock suficiente para o produto ${produto.refProduto}.`);
                    }

                    const produtoEncontrado = await Produto.findByRefProduto(produto.refProduto);
                    if (!produtoEncontrado) {
                        return res.status(400).send(`Produto não encontrado com a referência ${produto.refProduto}.`);
                    }

                    // Atualizar a quantidade de stock
                    // produtoStock.quantidade -= produto.quantity;
                    // await produtoStock.save();

                    // Verificar se o produto já existe no array de produtos da venda
                    let produtoExistente = null;
                    for (let j = 0; j < vendaExistente.produtos.length; j++) {
                        if (vendaExistente.produtos[j].ref == produto.refProduto) {
                            produtoExistente = vendaExistente.produtos[j];
                            break;
                        }
                    }

                    console.log('Produto existente:', produtoExistente);
                    if (produtoExistente) {
                        // Se o produto já existe, atualiza a quantidade
                        produtoExistente.quantidade += produto.quantity;
                        produtoExistente.preco = produtoEncontrado.preco; // Atualiza o preço, caso seja necessário
                    } else {
                        // Se o produto não existe, adiciona um novo produto ao array
                        vendaExistente.produtos.push({
                            ref: produto.refProduto,
                            nome: produtoEncontrado.nome,
                            preco: produtoEncontrado.preco,
                            quantidade: produto.quantity,
                            imagem: produtoEncontrado.imagem,
                        });
                    }

                    // Calcular o total adicional para o produto atual
                    const totalProduto = produtoEncontrado.preco * parseInt(produto.quantity);
                    totalAdicional += totalProduto;
                }

                // Atualizar o total da venda
                vendaExistente.total = (parseFloat(vendaExistente.total) + totalAdicional).toFixed(2);

                // Salvar a venda atualizada
                await vendaExistente.save();

                console.log('Venda atualizada com sucesso:', vendaExistente);

                res.status(200).json(vendaExistente);
            } catch (error) {
                console.error(error);
                res.status(500).send("Erro ao atualizar a venda. Por favor, tente novamente.");
            }
        });

    // Backend route adjustment
    router.delete('/venda/produto', verifyToken, async (req, res) => {
        const { nrVenda, productId } = req.body; // Extrai nrVenda e productId do corpo da requisição
        try {
            const venda = await VendaModel.findOne({ nrVenda });
            if (!venda) {
                return res.status(404).send('Venda não encontrada.');
            }

            venda.produtos = venda.produtos.filter(produto => produto.ref !== productId);
            await venda.save();

            res.status(200).send('Produto removido com sucesso.');
        } catch (error) {
            console.error('Erro ao remover produto da venda:', error);
            res.status(500).send('Erro ao remover produto da venda.');
        }
    });

    router.put('/venda/finalizar', verifyToken, async (req, res) => {
        try {
       //   console.log(req.body.produtos.ref);
          for (const produto of req.body.produtos) {
            console.log(produto.ref);
            const produtoDB = await StockController.findByRefProduto(produto.ref);
            if (!produtoDB) {
              throw new Error(`Produto ${produto.nome} não encontrado.`);
            }

            if (produtoDB.quantidade < produto.quantidade) {
              console.log(`Stock insuficiente para o produto ${produto.nome}.`);
            } else {
              produtoDB.quantidade -= produto.quantidade;
              await produtoDB.save();
            }  
          }
      
          const nrVenda = req.body.produtos[0].nrVenda;
          const venda = await VendaModel.findOne({ nrVenda });
          if (!venda) {
            throw new Error('Venda não encontrada.');
          }
          venda.estado = 'Finalizada';
          await venda.save();
      
          res.status(200).send('Compra finalizada com sucesso.');
        } catch (error) {
          console.error('Erro ao finalizar a compra:', error);
          res.status(500).send('Erro ao finalizar a compra.');
        }
      });


    return router;
};
module.exports = vendasRouter;
