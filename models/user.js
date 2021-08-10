/** @format */

const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    avatar: {
        type: String,
        default: process.env.CLOUDDINARY_DEFAULT_AVATAR_USER,
    },
    email: { type: String },
    password: { type: String, required: true, minLength: 8 },
    phone: { type: String },
    accountType: { type: String, default: "normal" },
    socialId: { type: String },
    isFirstLogin: { type: Boolean, default: true },
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
    children: [
        { type: mongoose.Types.ObjectId, required: true, ref: "Children" },
    ],
    blockUsers: [
        { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    ],
});

userSchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret.id;
    },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
