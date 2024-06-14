var mongoose = require("mongoose");

let Schema = mongoose.Schema;

let StockSchema = new Schema({
    quantidade: { type: Number, require: true },
    data: { type: Date, require: true },
    anotacoes: { type: String, require: true },
});

var ProdutoSchema = new Schema({
    referencia: { type: Number, require: true, unique: true },
    nome: { type: String, require: true },
    descricao: { type: String, require: true },
    preco: { type: Number, require: true, fixed: 2 },
    stock: { type: StockSchema},
    categoria: { type: String, require: true },
    imagem: { type: String, require: false },
});

let Produto = mongoose.model("Produto", ProdutoSchema);

module.exports = Produto;
