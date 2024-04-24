const Stock = require("./stock")
function stockController(StockModel) {
    let controller = {
        create,
        findAll,
        removeById,
        findById,
        trackingById,

    };
    function create(values) {
        let newStock = StockModel(values);
        return save(newStock);
    }

    function save(newStock){
        return new Promise(function (resolve, reject){
            newStock
                .save()
                .then(() => resolve("New stock created."))
                .catch((err) => reject(err));
            console.log(`new stock created`)
        });
    }

    function findAll() {
        return new Promise(function (resolve, reject) {
            StockModel.find({})
                .then((users) => resolve(users))
                .catch((err) => reject(err));
        });
    }
    function removeById(id) {
        return new Promise(function (resolve, reject) {
            StockModel.findByIdAndDelete(id)
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }

    function findById(id) {
        return new Promise(function (resolve, reject) {
            StockModel.findById(id)
                .then((stock) => resolve(stock))
                .catch((err) => reject(err));
        });
    }

    function trackingById(id) {
        return new Promise(function (resolve, reject) {
            StockModel.findById(id)
                .then((stock) => resolve(stock.movimento))
                .then((stock) => resolve(stock.data))
                .catch((err) => reject(err));
        });
    }

    return controller;
}

module.exports = stockController;