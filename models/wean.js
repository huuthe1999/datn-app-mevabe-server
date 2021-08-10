const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const weanSchema = new Schema({
    child: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Children"
    },
    description: { type: String, default: "Ăn dặm" },
    date: { type: Number, default: new Date().getTime(), required: true },
    nameFood: {
        type: String,
        required: true
    },
    cooking: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0,
        required: true
    },
    foodAmount: { type: Number, required: true },
    unit: {
        type: Number,
        enum: [0, 1, 2],
        default: 0,
        required: true
    },
    material: { type: String },
    rating: {
        type: Number,
        enum: [0, 1, 2, 3],//"Rất thích", "Hơi thích", "Bình thường", "Không thích"
        default: 0
    },
    note: { type: String },
    images: [{ type: String }],
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

weanSchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret.id;
    },
});

weanSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Wean", weanSchema);
