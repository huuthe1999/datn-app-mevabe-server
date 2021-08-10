const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    conversation: { type: mongoose.Types.ObjectId, ref: "Conversation" },
    sender: { type: mongoose.Types.ObjectId, ref: "User" },
    recipient: { type: mongoose.Types.ObjectId, ref: "User" },
    text: String,
    media: Array,
    time: Number,
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});


module.exports = mongoose.model("Message", messageSchema);