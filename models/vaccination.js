const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const vaccinationSchema = new Schema({
    diseaseName: { type: String, required: true},
    diseaseDescription: { type: String, required: true},
    content: { type: String, required: true },
    sideEffects: { type: String, required: true},
    isCompulsory: { type: Boolean, required: true},
    vaccinationShots: [{ type: mongoose.Types.ObjectId, required: true, ref: "Vaccination_shot" }],
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

vaccinationSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Vaccination", vaccinationSchema);