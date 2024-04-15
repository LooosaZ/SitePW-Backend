const express = require("express");

let ProductAPI = require("./server/products");
let StockAPI = require("./server/stock");
let UserAPI = require("./server/users");
let SalesAPI = require("./server/sales");

function initialize() {
    let api = express();
    api.use("/menu", UserAPI());

    return api;
}

module.exports = {initialize: initialize};