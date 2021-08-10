const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const vaccinationShotChildSchema = new Schema({
    status: { type: Number, enum: [0, 1, 2], default: 0, required: true}, //0: chưa tiêm, 1: đã tiêm, 2: bỏ qua
    vaccinationShotId: { type: mongoose.Types.ObjectId, required: true, ref: "Vaccination_shot" },
    childId: { type: mongoose.Types.ObjectId, required: true, ref: "Children" },
    date: { type: Number },
    note: { type: String },
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

vaccinationShotChildSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Vaccination_shot_children", vaccinationShotChildSchema);