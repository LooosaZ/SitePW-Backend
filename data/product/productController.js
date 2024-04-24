function ProductController(ProductModel) {
    let controller = {
        create,
        findAll,
        findById,
    }

    function create (product){
        console.log(`preparing to create new Product`);
        let newProd = ProductModel(product);
        return save(newProd);
    }

    function save (newProd){
        return new Promise(function (resolve, reject) {
            newProd.save()
                .then(() => resolve('New product added to data-base'))
                .catch((err) => reject(err));
        });
    }

    function findAll() {
        return new Promise(function (resolve, reject) {
            ProductModel.find({})
                .then((product) => resolve(product))
                .catch((err) => reject(err));
        });
    }

    function findById(id) {
        return new Promise(function (resolve, reject) {
            ProductModel.findById(id)
                .then((product) => resolve(product))
                .catch((err) => reject(err));
        });
    }
    return controller
}

module.exports = ProductController;
