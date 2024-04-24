let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let ProductSchema = new Schema({
    nome: { type: String, require: true, },
    preco: { type: Number, min:0, require: true },
    categoria: { type: String, require: true },
    descricao: { type: String, require: true },
    classificacao: { type: Number, trim: true, default:5, min: 0, max: 5 },


});

let Product = mongoose.model("Product", ProductSchema);

module.exports = Product;