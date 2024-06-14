var mongoose = require("mongoose");

let Schema = mongoose.Schema;

var StockSchema = new Schema({
    referencia: { type: Number, require: true, unique: true },
    movimento: { type: String, require: true },
    quantidade: { type: Number, require: true },
    refProduto: { type: Number, require: true },
    data: { type: Date, require: true },
    anotacoes: { type: String, require: false }
});

let Stock = mongoose.model("Stock", StockSchema);

module.exports = Stock;
