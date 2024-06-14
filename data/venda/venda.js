var mongoose = require("mongoose");

let Schema = mongoose.Schema;

let ProdutoSchema = new Schema({
    ref: { type: Number, require: true},
    nome: { type: String, require: true },
    quantidade: {type: Number, require: true},
    preco: { type: Number, require: true },
});

let utilizadorSchema = new Schema({
    usernameUtilizador: { type: String, require: true },
    nomeUtilizador: { type: String, require: true },
    contactoUtilizador: { type: String, require: false },
});

var vendaSchema = new Schema({
    nrVenda: { type: Number, require: true, unique: true },
    cliente: { type: utilizadorSchema, require: true},
    produtos: [{ type: ProdutoSchema, require: true}],
    total: { type: Number, require: true },
    estado: { type: String, require: true },
});

let Venda = mongoose.model("Venda", vendaSchema);

module.exports = Venda;
