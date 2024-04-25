// This function initializes a stockController with CRUD operations for interacting with a StockModel.

const Stock = require("./stock");  // Importing Stock model

function stockController(StockModel) {
    // Object to hold controller functions
    let controller = {
        create,           // Function to create a new stock
        findAll,          // Function to find all stocks
        removeById,       // Function to remove a stock by its ID
        findById,         // Function to find a stock by its ID
        trackingById      // Function to track movements of a stock by its ID
    };

    // Function to create a new stock
    function create(values) {
        let newStock = StockModel(values);  // Create a new stock instance
        return save(newStock);  // Save the new stock
    }

    // Function to save a stock
    function save(newStock) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            newStock
                .save()  // Save the stock to the database
                .then(() => {
                    console.log(`New stock created.`);
                    resolve("New stock created.");  // Resolve if successful
                })
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to find all stocks
    function findAll() {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            StockModel.find({})  // Find all stocks
                .then((stocks) => resolve(stocks))  // Resolve with the found stocks
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to remove a stock by its ID
    function removeById(id) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            StockModel.findByIdAndDelete(id)  // Find and delete stock by ID
                .then(() => resolve())  // Resolve if successful
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to find a stock by its ID
    function findById(id) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            StockModel.findById(id)  // Find stock by ID
                .then((stock) => resolve(stock))  // Resolve with the found stock
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to track movements of a stock by its ID
    function trackingById(id) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            StockModel.findById(id)  // Find stock by ID
                .then((stock) => resolve(stock.movimento))  // Resolve with the movements of the stock
                .then((stock) => resolve(stock.data))  // Resolve with the dates of the movements
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    return controller;  // Return the controller object with all CRUD operations
}

module.exports = stockController;  // Export the stockController function
