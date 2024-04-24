function ProductController(ProductModel) {
    let controller = {
        create,
        findAll,
        findById,
        removeById,
        modifyByID
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

    function removeById(id) {
        return new Promise(function (resolve, reject) {
            ProductModel.findByIdAndDelete(id)
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }

    // function modifyByID (id, newData) {
    //     return new Promise(function (resolve, reject) {
    //         ProductModel.findByIdAndUpdate(id, newData, { new: true })
    //             .then(() => resolve())
    //             .catch((err) => reject(err));
    //     })
    // }

    return controller
}

module.exports = ProductController;
