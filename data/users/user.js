var mongoose = require("mongoose");
let scopes = require("./scopes");
let Schema = mongoose.Schema;

let RoleSchema = new Schema({
    name: { type: String, required: true },
    scopes: [{ type: String, enum: [scopes["administrador"], scopes["gestor"], scopes["utilizador"]] }]
});


var UserSchema = new Schema({
    username: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    name: { type: String, require: true },
    role: { type: RoleSchema },
    morada: { type: String, require: true },
    telemovel: { type: String, require: true },
    dataNascimento: { type: Date, require: true },
    nif: { type: String, require: true },
    email: { type: String, require: true },
    resetToken: { type: String, require: true },
    favoritos: [{type: String, require: false}]
});

let UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
