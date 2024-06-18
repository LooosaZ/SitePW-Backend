const Stock = require("./stock");

function stockController(StockModel) {
    let controller = {
        create,
        findAll,
        findByReferencia,
        updateByReferencia,
        deleteByReferencia,
        findByRefProduto,
        removeByReferencia,
        updateStockDelete,
        updateStock,
        updateByRefProduto
    };

    function create(values) {
        let newStock = StockModel(values);
        return save(newStock);
    }

    function save(newStock) {
        return new Promise(function (resolve, reject) {
            newStock
                .save()
                .then(() => resolve("O movimento de stock foi adicionado!"))
                .catch((err) => reject(err));
        });
    }

    function findAll(sortOptions) {
        return new Promise(function (resolve, reject) {
            StockModel.find({})
                .sort(sortOptions)
                .then((stocks) => resolve(stocks))
                .catch((err) => reject(err));
        });
    }

    function findByReferencia(referencia) {
        return new Promise(function (resolve, reject) {
            StockModel.findOne({ referencia: referencia })
                .then((stock) => resolve(stock))
                .catch((err) => reject(err));
        });
    }

    function updateByReferencia(referencia, stock) {
        return new Promise(function (resolve, reject) {
            StockModel.findOneAndUpdate({ referencia }, stock)
                .then(() => resolve(stock))
                .catch((err) => reject(err));
        });
    }

    function deleteByReferencia(referencia) {
        return new Promise(function (resolve, reject) {
            StockModel.findOneAndDelete({ referencia })
                .then((stock) => {
                    if (!stock) {
                        reject("Não foi possível encontrar um movimento de stock com essa referência!");
                    }
                    resolve();
                })
                .catch((err) => reject(err));
        });
    }

    function removeByReferencia(refProduto) {
        return new Promise(function (resolve, reject) {
            StockModel.findOneAndDelete({ refProduto })
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    function findByRefProduto(refProduto) {
        return new Promise(function (resolve, reject) {
            StockModel.findOne({ refProduto: refProduto })
                .then((stock) => resolve(stock))
                .catch((err) => reject(err));
        });
    }

    function updateStock(refProduto, diffQuantidade) {
        return new Promise((resolve, reject) => {
            StockModel.findOne({ refProduto: refProduto })
                .then((produto) => {
                    if (!produto) {
                        reject(`Produto ${refProduto} não encontrado no stock`);
                        return;
                    }

                    if (diffQuantidade > 0) {
                        if (produto.quantidade < diffQuantidade) {
                            reject(`Não há stock suficiente para remover ${diffQuantidade} unidades do produto ${refProduto}`);
                            return;
                        }
                        return StockModel.findOneAndUpdate(
                            { refProduto: refProduto },
                            { $inc: { quantidade: -diffQuantidade } },
                            { new: true }
                        );
                    }
                    return StockModel.findOneAndUpdate(
                        { refProduto: refProduto },
                        { $inc: { quantidade: Math.abs(diffQuantidade) } },
                        { new: true }
                    );
                })
                .then((produtoAtualizado) => {
                    resolve(produtoAtualizado);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async function updateStockDelete(refProduto, diffQuantidade) {
        try {
            const produto = await StockModel.findOne({ refProduto: refProduto });

            if (!produto) {
                throw new Error(`Produto ${refProduto} não encontrado no stock`);
            }

            const novoStock = produto.quantidade + diffQuantidade;

            const produtoAtualizado = await StockModel.findOneAndUpdate(
                { refProduto: refProduto },
                { quantidade: novoStock },
                { new: true }
            );

            return produtoAtualizado;
        } catch (error) {
            throw error;
        }
    }

    function updateByRefProduto(refProduto, stock) {
        return new Promise(function (resolve, reject) {
            StockModel.findOneAndUpdate({ refProduto }, stock, { new: true })
                .then((updatedStock) => {
                    if (!updatedStock) {
                        reject(`Produto com referência ${refProduto} não encontrado`);
                    }
                    resolve(updatedStock);
                })
                .catch((err) => reject(err));
        });
    }

    return controller;
}

module.exports = stockController;
