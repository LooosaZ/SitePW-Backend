let mongoose = require("mongoose");

let Schema = mongoose.Schema;


let StockSchema = new Schema({

    movimento: {type: String, require: true},
    produtos: [ProdutoSchema],
    quantidade: {type: Number },
    data: {data: {type: Date, default: Date.now}},
    cliente: {type: String, require: true},
    total: {type: Number, require: true},

});

let Stock = mongoose.model("Stock", StockSchema);

module.exports = Stock;