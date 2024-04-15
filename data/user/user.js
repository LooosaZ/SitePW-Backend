let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let UserSchema = new Schema({
    
    nome: { type: String, require: true },
    morada: { type: String, require: true },
    nif: { type: Number, require: true, unique: true },
    email: { type: String, require: true },
    password: { type: String, require: true }
});


let User = mongoose.model("User", UserSchema);

module.exports = User;

