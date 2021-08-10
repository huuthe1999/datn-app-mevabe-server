const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const growNoteSchema = new Schema({
    childId: { type: mongoose.Types.ObjectId, required: true, ref: "Children" },
    data: { type: Number },
    text: { type: String },
    date: {type:Number, default: new Date().getTime(), required: true},
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

growNoteSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Grow_note", growNoteSchema);