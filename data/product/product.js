let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let ProductSchema = new Schema({
    ref: { type: Number, require: true, unique: true },
    nome: { type: String, require: true },
    preco: { type: Number, require: true }
});