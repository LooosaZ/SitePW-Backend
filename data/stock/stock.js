let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let StockSchema = new Schema({

    movimento: {type: String, require: true},
    quantidade: {type: Number ,require: true, min: 10},
    data: {data: {type: Date, default: Date.now}},
    total: {type: Number, require: true, min:10},

});

let Stock = mongoose.model("Stock", StockSchema);

module.exports = Stock;