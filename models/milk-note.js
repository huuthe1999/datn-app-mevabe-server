const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const milkNoteSchema = new Schema({
    childId: { type: mongoose.Types.ObjectId, required: true, ref: "Children" },
    motherMilk: { type: Number, default: 0},
    powderedMilk: { type: Number, default: 0},
    note: { type: String },
    date: {type:Number, default: new Date().getTime(), required: true},
    startTime: {type:Number},
    endTime: {type:Number},
    images: [{ type: String }],
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

milkNoteSchema.plugin(uniqueValidator);

milkNoteSchema.virtual('totalMilk').get(function () {
    return this.motherMilk + this.powderedMilk;
});

milkNoteSchema.set('toJSON', {
    virtuals: true,
});

module.exports = mongoose.model("Milk_note", milkNoteSchema);