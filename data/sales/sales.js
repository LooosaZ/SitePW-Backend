let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let ProductSchema = new Schema({
    ref: { type: Number, require: true, unique: true },
    nome: { type: String, require: true },
    preco: { type: Number, require: true }
});

let salesSchema = new Schema({
    nrVenda: {type: Number, require: true, unique: true},
    cliente: {type: String, require: true },
    produtos: [{ type: ProductSchema }],
    total: {type: Number, require: true},
    estado: {type: String, require: true},
    data: {type: Date, default: Date.now}
});

let Sales = mongoose.model("Sales", salesSchema);

module.exports = Sales;