function ProductController(ProductModel) {
    let controller = {
        create,
        findAll,
        update,
        findByreferencia,
        removeByreferencia,
        findByRefProduto,
    };

    function create(values) {
        let newProduct = ProductModel(values);
        return save(newProduct);
    }

    function save(newProduct) {
        return new Promise(function (resolve, reject) {
            newProduct
                .save()
                .then(() => resolve("Successfully created a new product"))
                .catch((err) => reject(err));
        });
    }

    function findAll(filter) {
        return new Promise(function (resolve, reject) {
            ProductModel.find(filter)
                .then((produtos) => resolve(produtos))
                .catch((err) => reject(err));
        });
    }

    function findByreferencia(referencia) {
        return new Promise(function (resolve, reject) {
            ProductModel.findOne({ referencia: referencia })
                .then((produto) => resolve(produto))
                .catch((err) => reject(err));
        });
    }

    function update(referencia, produto) {
        return new Promise(function (resolve, reject) {
            ProductModel.findOneAndUpdate({ referencia }, produto)
                .then(() => resolve(produto))
                .catch((err) => reject(err));
        });
    }

    function removeByreferencia(referencia) {
        return new Promise(function (resolve, reject) {
            ProductModel.findOneAndDelete({ referencia })
                .then((Produto) => {
                    if (!Produto) {
                        reject("There is no product with said reference");
                    }
                    resolve();
                })
                .catch((err) => reject(err));
        });
    }

    function findByRefProduto(refProduct) {
        return new Promise(function (resolve, reject) {
            ProductModel.findOne({ referencia: refProduct })
                .then((product) => resolve(product))
                .catch((err) => reject(err));
        });
    }

    return controller;
}

module.exports = ProductController;
