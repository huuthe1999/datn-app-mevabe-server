const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const standardGrowNoteSchema = new Schema({
    isBorn: { type: Boolean, default: false},
    gender: { type: Number, enum: [0, 1, 2], default: 0 },
    data: [{ type: Number }],
    maxData: [{ type: Number}],
    minData: [{ type: Number}],
    times: [{ type:Number }],
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

standardGrowNoteSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Standard_height_note", standardGrowNoteSchema);