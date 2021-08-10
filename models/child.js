const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const childSchema = new Schema({
    name: { type: String, required: true },
    avatar: {
        type: String,
        default: process.env.CLOUDDINARY_DEFAULT_AVATAR_BABY,
    },
    avatar_background: {
        type: String,
        default: process.env.CLOUDDINARY_DEFAULT_AVATAR_BABY_BACKGROUND,
    },
    nickname: { type: String },
    // birthday: { type: Date },
    birthday: { type: Number, default: new Date().getTime() },
    gender: { type: Number, enum: [0, 1, 2], default: 0 },
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    grow_notes: [
        { type: mongoose.Types.ObjectId, required: true, ref: "Grow_note" },
    ],
    height_notes: [
        { type: mongoose.Types.ObjectId, required: true, ref: "Height_note" },
    ],
    weight_notes: [
        { type: mongoose.Types.ObjectId, required: true, ref: "Weight_note" },
    ],
    milk_notes: [
        { type: mongoose.Types.ObjectId, required: true, ref: "Milk_note" },
    ],
    appointments: [
        { type: mongoose.Types.ObjectId, required: true, ref: "Appointment" },
    ],
    notes: [{ type: mongoose.Types.ObjectId, required: true, ref: "Note" }],
    weans: [{ type: mongoose.Types.ObjectId, required: true, ref: "Wean" }],
});

childSchema.plugin(uniqueValidator);

childSchema.virtual("isBorn").get(function () {
    return this.birthday < new Date().getTime();
});

childSchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret.id;
    },
});

module.exports = mongoose.model("Children", childSchema);
