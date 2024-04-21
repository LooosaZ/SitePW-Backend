let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let StockSchema = new Schema({

    movimento: {type: String, require: true},
    quantidade: {type: Number },
    data: {data: {type: Date, default: Date.now}},
    total: {type: Number, require: true},

});

let Stock = mongoose.model("Stock", StockSchema);

module.exports = Stock;