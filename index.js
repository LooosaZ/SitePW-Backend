// Dependências
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser'); 
const config = require("./config");
const cors = require("cors");

// Ligação ao servidor
const hostname = "127.0.0.1";
const port = 3001;

// Arranque do servidor
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
};

let router = require("./router");
var app = express();
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(router.initialize());
const server = http.Server(app);

// Ligação ao Cluster
mongoose
    .connect(config.db)
    .then(() => console.log("Conexão estabelecida!"))
    .catch((err) => console.error(err));
server.listen(port, hostname, () => {
    console.log(`Endereço do servidor: http://${hostname}:${port}/`);
});