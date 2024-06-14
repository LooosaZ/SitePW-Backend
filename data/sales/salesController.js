function salesController(salesModel) {
    let controller = {
        create,
        findAll,
        update,
        findByNrVenda,
        removeByNrVenda,
        findByUsername,
        findByNrVendaAndUsername
    };

    function create(values) {
        let newSale = salesModel(values);
        return save(newSale);
    }

    function save(newSale) {
        return new Promise(function (resolve, reject) {
            newSale
                .save()
                .then(() => resolve("Successfully sold the item."))
                .catch((err) => reject(err));
        });
    }

    function findAll() {
        return new Promise(function (resolve, reject) {
            salesModel.find({})
                .then((sales) => resolve(sales))
                .catch((err) => reject(err));
        });
    }

    function findByNrVenda(nrSale) {
        return new Promise(function (resolve, reject) {
            salesModel.findOne({ nrVenda: nrSale })
                .then((sale) => resolve(sale))
                .catch((err) => reject(err));
        });
    }

    function findByUsername(usernameUser) {
        return new Promise(function (resolve, reject) {
            salesModel.find({usernameUser})
                .then((sales) => {
                    if (sales.length === 0) {
                        reject("This user has not bought anything.");
                        return;
                    }
                    resolve(sales);
                })
                .catch((err) => reject(err));
        });
    }

    function findByNrVendaAndUsername(nrSale, username) {
        return new Promise(function (resolve, reject) {
            salesModel.findOne({ nrSale, username })
                .then((sale) => {
                    if (!sale) {
                        reject("This sale does not exist.");
                        return;
                    }
                    resolve(sale);
                })
                .catch((err) => reject(err));
        });
    }

    function update(nrSale, sale) {
        return new Promise(function (resolve, reject) {
            salesModel.findOneAndUpdate({ nrSale }, sale)
                .then(() => resolve(sale))
                .catch((err) => reject(err));
        });
    }

    function removeByNrVenda(nrSale) {
        return new Promise(function (resolve, reject) {
            salesModel.findOneAndDelete({ nrVenda: nrSale })
                .then((sale) => {
                    if (!sale) {
                        reject("There is no sale with said reference");
                    }
                    resolve();
                })
                .catch((err) => reject(err));
        });
    }

    return controller;
}

module.exports = salesController;
