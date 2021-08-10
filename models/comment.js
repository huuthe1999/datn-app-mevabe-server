const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    status: { type: mongoose.Types.ObjectId, required: true, ref: "Status" },
    content: { type: String, required: true },
    images: [{ type: String }],
    subComments: [{ type: mongoose.Types.ObjectId, required: true, ref: "Comment" }],
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

commentSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Comment", commentSchema);