const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { convertToSlug } = require("../helpers/convertToSlug");

const Schema = mongoose.Schema;

const categoryMarkerSchema = new Schema({
    name: { type: String, required: true },
    thumbnail: { type: String },
    markers: [{ type: mongoose.Types.ObjectId, ref: "Marker" }],
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

categoryMarkerSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Category_marker", categoryMarkerSchema);