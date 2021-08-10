const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const noteSchema = new Schema({
    content: { type: String},
    childId: { type: mongoose.Types.ObjectId, required: true, ref: "Children" },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    remindAt: {type:Number, default: new Date().getTime(), required: true},
    isReminded: {type:Boolean, default: false},
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

noteSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Note", noteSchema);