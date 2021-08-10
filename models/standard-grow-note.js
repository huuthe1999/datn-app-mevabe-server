const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const standardGrowNoteSchema = new Schema({
    isBorn: { type: Boolean, default: false},
    gender: { type: Number, enum: [0, 1, 2], default: 0 },
    weights: [{ type: Number }],
    heights: [{ type: Number }],
    maxWeights: [{ type: Number}],
    minWeights: [{ type: Number}],
    maxHeights: [{ type: Number}],
    minHeights: [{ type: Number}],
    times: [{ type:Number }],
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

standardGrowNoteSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Standard_grow_note", standardGrowNoteSchema);