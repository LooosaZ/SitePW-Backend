let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let ProductSchema = new Schema({
    ref: { type: Number, require: true},
    nome: { type: String, require: true },
    quantidade: {type: Number, require: true},
    preco: { type: Number, require: true },
});

let userSchema = new Schema({
    usernameUser: { type: String, require: true },
    nomeUser: { type: String, require: true },
    contactoUser: { type: String, require: false },
});

let salesSchema = new Schema({
    nrVenda: { type: Number, require: true, unique: true },
    cliente: { type: userSchema, require: true},
    produtos: [{ type: ProductSchema, require: true}],
    total: { type: Number, require: true },
    estado: { type: String, require: true },
});

let Sales = mongoose.model("Sales", salesSchema);

module.exports = Sales;
