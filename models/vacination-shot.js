const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const vaccinationShotSchema = new Schema({
    description: { type: String, required: true },
    time: { type: String, required: true },
    vaccinationId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Vaccination",
    },
    timeToRemind: {
        start: { type: String, default: "0" },
        end: { type: String, default: "0" }
    }, //Back end only
    vaccinationShotChild: [{ type: mongoose.Types.ObjectId, required: true, ref: "Vaccination_shot_children" }],
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

vaccinationShotSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Vaccination_shot", vaccinationShotSchema);
