const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    recipients: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Types.ObjectId, ref: 'Message'},
    isSeen: { type: Boolean, default: false},
    updateAt: {type:Number, default: new Date().getTime()},
});

conversationSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Conversation", conversationSchema);