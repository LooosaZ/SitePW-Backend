let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ProductSchema = new Schema({
    nome: { type: String, require: true, },
    preco: { type: Number, min:0, require: true },
    categoria: { type: String, require: true },
    descricao: { type: String, require: true },
    classificacao: { type: Number, trim: true, default:5, min: 0, max: 5 },
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