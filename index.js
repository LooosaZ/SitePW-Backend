const express = require('express');
const http = require('http');
const config = require("./config");

const hostname = '127.0.0.1';
const port = 3000;
let router = require('./router');
const { default: mongoose } = require('mongoose');
var app = express();
app.use(router.initialize());
  
const server = http.Server(app);

mongoose.connect(config.db)
.then(() => console.log("Conection successful!"))
.catch((err) => console.error(err));


server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });