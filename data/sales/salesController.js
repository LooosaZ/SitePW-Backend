function salesController(SaleModel) {
    let controller = {
        findAll,
        findById,
    };
    function findAll() {
        return new Promise(function (resolve, reject) {
            SaleModel.find({})
                .then((sales) => resolve(sales))
                .catch((err) => reject(err));
        });
    }

    function findById(id) {
        return new Promise(function (resolve, reject) {
            SaleModel.findById(id)
                .then((sales) => resolve(sales))
                .catch((err) => reject(err));
        });
    }



    return controller;
}

module.exports = salesController;