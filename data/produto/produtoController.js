function ProdutoController(ProdutoModel) {
    let controller = {
        create,
        findAll,
        update,
        findByreferencia,
        removeByreferencia,
        findByRefProduto,
    };

    function create(values) {
        let newProduto = ProdutoModel(values);
        return save(newProduto);
    }

    function save(newProduto) {
        return new Promise(function (resolve, reject) {
            newProduto
                .save()
                .then(() => resolve("O produto foi criado com sucesso!"))
                .catch((err) => reject(err));
        });
    }

    function findAll(filter) {
        return new Promise(function (resolve, reject) {
            ProdutoModel.find(filter)
                .then((produtos) => resolve(produtos))
                .catch((err) => reject(err));
        });
    }    

    function findByreferencia(referencia) {
        return new Promise(function (resolve, reject) {
            ProdutoModel.findOne({ referencia: referencia })
                .then((produto) => resolve(produto))
                .catch((err) => reject(err));
        });
    }

    function update(referencia, produto) {
        return new Promise(function (resolve, reject) {
            ProdutoModel.findOneAndUpdate({ referencia }, produto)
                .then(() => resolve(produto))
                .catch((err) => reject(err));
        });
    }

    function removeByreferencia(referencia) {
        return new Promise(function (resolve, reject) {
            ProdutoModel.findOneAndDelete({ referencia })
                .then((Produto) => {
                    if (!Produto) {
                        reject("Não foi possível encontrar um produto com essa referência!");
                    }
                    resolve();
                })
                .catch((err) => reject(err));
        });
    }

    function findByRefProduto(refProduto) {
        return new Promise(function (resolve, reject) {
            ProdutoModel.findOne({ referencia: refProduto })
                .then((produto) => resolve(produto))
                .catch((err) => reject(err));
        });
    }

    return controller;
}

module.exports = ProdutoController;
