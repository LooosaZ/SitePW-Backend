// This function initializes a ProductController with CRUD operations for interacting with a ProductModel.

function ProductController(ProductModel) {
    // Object to hold controller functions
    let controller = {
        create,            // Function to create a new product
        findAll,           // Function to find all products
        findById,          // Function to find a product by its ID
        removeById,        // Function to remove a product by its ID
        modifyByID,        // Function to modify a product by its ID
        sortAscending,     // Function to sort products in ascending order
        sortDescending     // Function to sort products in descending order
    }

    // Function to create a new product
    function create(product) {
        console.log(`preparing to create new Product`);
        let newProd = ProductModel(product);
        return save(newProd);  // Save the new product
    }

    // Function to save a product
    function save(newProd) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            newProd.save()  // Save the product to the database
                .then(() => resolve('New product added to database'))  // Resolve if successful
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to find all products
    function findAll() {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            ProductModel.find({})  // Find all products
                .then((product) => resolve(product))  // Resolve with the found products
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to find a product by its ID
    function findById(id) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            ProductModel.findById(id)  // Find product by ID
                .then((product) => resolve(product))  // Resolve with the found product
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to remove a product by its ID
    function removeById(id) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            ProductModel.findByIdAndDelete(id)  // Find and delete product by ID
                .then(() => resolve())  // Resolve if successful
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to modify a product by its ID
    function modifyByID(id, newData) {
        // Return a promise for asynchronous handling
        return new Promise(function (resolve, reject) {
            ProductModel.findByIdAndUpdate(id, newData, { new: true })  // Find and update product by ID
                .then(() => resolve())  // Resolve if successful
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to sort products in ascending order
    function sortAscending() {
        return new Promise(function (resolve, reject) {
            ProductModel.find({})
                .sort({ nome: 'asc' }) // Sort by the 'nome' field in ascending order
                .then((products) => resolve(products))  // Resolve with sorted products
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    // Function to sort products in descending order
    function sortDescending() {
        return new Promise(function (resolve, reject) {
            ProductModel.find({})
                .sort({ nome: 'desc' }) // Sort by the 'nome' field in descending order
                .then((products) => resolve(products))  // Resolve with sorted products
                .catch((err) => reject(err));  // Reject if an error occurs
        });
    }

    return controller;  // Return the controller object with all CRUD operations
}

module.exports = ProductController;  // Export the ProductController function
