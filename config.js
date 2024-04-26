require('dotenv').config();

const dbName = process.env.DB_NAME;
const dbSecret = process.env.DB_SECRET;

const config = {
    db: dbName,
    secret:dbSecret,
    expiresPassword: 86400, //one day token duration. (change this later on development)
    saltRounds: 10,
};

module.exports = config;