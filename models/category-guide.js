const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { convertToSlug } = require("../helpers/convertToSlug");

const Schema = mongoose.Schema;

const categoryGuideSchema = new Schema({
    name: { type: String, required: true },
    thumbnail: { type: String },
    guides: [{ type: mongoose.Types.ObjectId, ref: "Guide" }],
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

categoryGuideSchema.plugin(uniqueValidator);

categoryGuideSchema.virtual('slug').get(function () {
    return convertToSlug(this.name, this._id);
});

module.exports = mongoose.model("Category_guide", categoryGuideSchema);