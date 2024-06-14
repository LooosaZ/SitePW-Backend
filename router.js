const express = require("express");

let ProdutoAPI = require("./server/produtos");
let StockAPI = require("./server/stock");
let UtilizadorAPI = require("./server/utilizadores");
let VendaAPI = require("./server/vendas");
let AuthApi = require("./server/auth");

function initialize(app) {
    let api = express();
    api.use("/menu", UtilizadorAPI());
    api.use("/menu", VendaAPI());
    api.use("/menu", ProdutoAPI());
    api.use("/menu", StockAPI());
    api.use("/auth", AuthApi());

    return api;
}

module.exports = { initialize: initialize };
