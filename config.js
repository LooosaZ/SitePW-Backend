const config = {
    db: "mongodb+srv://LoosaZ:aulaspw@pw-cluster.eno3da7.mongodb.net/?retryWrites=true&w=majority",
    secret:"CRSIsecretpassword",
    expiresPassword: 86400, //one day token duration. (change this later on development)
};

module.exports = config;