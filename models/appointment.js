const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
    address: { type: String, required: true },
    date: {type:Number, default: new Date().getTime(), required: true},
    description: { type: String},
    childId: { type: mongoose.Types.ObjectId, required: true, ref: "Children" },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    createAt: {type:Number, default: new Date().getTime()},
    updateAt: {type:Number, default: new Date().getTime()},
});

appointmentSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Appointment", appointmentSchema);