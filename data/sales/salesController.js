// Importing the Stock model for managing stock data
const Stock = require("../stock/stock");

// Function for managing sales-related operations
function salesController(SaleModel) {
    // Object containing controller functions
    let controller = {
        findAll,
        findById,
        addSale,
    };

    // Function to find all sales
    function findAll() {
        return new Promise(function (resolve, reject) {
            SaleModel.find({})  // Finding all sales
                .then((sales) => resolve(sales))  // Resolving with found sales
                .catch((err) => reject(err));  // Rejecting with error if any
        });
    }

    // Function to find a sale by ID
    function findById(id) {
        return new Promise(function (resolve, reject) {
            SaleModel.findById(id)  // Finding sale by ID
                .then((sales) => resolve(sales))  // Resolving with found sale
                .catch((err) => reject(err));  // Rejecting with error if any
        });
    }

    // Async function to add a new sale
    async function addSale(saleDetails) {
        try {
            // Calculate the number of items purchased
            const nrVenda = saleDetails.produtos.length;

            // Create a new sale object with the provided details
            const newSale = new SaleModel({
                nrVenda,
                cliente: saleDetails.cliente,
                produtos: saleDetails.produtos,
                total: saleDetails.total,
                estado: saleDetails.estado,
                data: saleDetails.data || Date.now(), // Use current date if not provided
            });

            // Save the new sale to the database
            const savedSale = await newSale.save();

            // Subtract the amount of items purchased from the stock
            const stockItems = await Stock.findOne(); // Assuming there's only one stock entry
            if (stockItems) {
                stockItems.quantidade -= nrVenda; // Subtract nrVenda from the stock quantity
                await stockItems.save(); // Save the updated stock

                // Check if stock is low
                if (stockItems.quantidade < 10) {
                    console.log('Warning: RE-STOCK IS NEEDED.');
                }
            }

            return savedSale; // Returning the saved sale
        } catch (err) {
            console.log(err); // Logging error if occurred
            throw err; // Throwing error
        }
    }

    return controller; // Returning the controller object
}

module.exports = salesController; // Exporting the salesController function
