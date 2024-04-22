let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let scopes = require("./scopes");

let RoleSchema = new Schema({
    name: {type: String, required: true},
    scopes: [{type: String, enum:[scopes[`read-all`], scopes[`read-posts`], scopes[`manage-posts`], scopes[`manage-posts`]]}]
});

let UserSchema = new Schema({
    
    name: { type: String, require: true, unique: true },
    email: { type: String, require: true },
    password: { type: String, require: true },
    role: { type: RoleSchema }
});


let User = mongoose.model("User", UserSchema);

module.exports = User;

