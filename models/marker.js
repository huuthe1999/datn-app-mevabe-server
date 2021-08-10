const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const markerSchema = new Schema({
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    type: {
        type: Number,
        enum: [0, 1, 2],
    },
    category: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Category_marker",
    },
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

markerSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Marker", markerSchema);
