const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const adminSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true, minLength: 8 },
    role: { type: String, default: "admin" },
});

adminSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Admin", adminSchema);
