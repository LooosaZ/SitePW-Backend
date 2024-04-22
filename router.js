const express = require("express");

let ProductAPI = require("./server/products");
let StockAPI = require("./server/stock");
let UserAPI = require("./server/users");
let SalesAPI = require("./server/sales");
let AuthAPI = require("./server/auth");

function initialize() {
    let api = express();
    api.use("/menu", UserAPI());
    api.use("/stock", StockAPI());
    api.use("/auth", AuthAPI());
    return api;
}

module.exports = {initialize: initialize};