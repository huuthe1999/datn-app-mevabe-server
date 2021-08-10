const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { convertToSlug } = require("../helpers/convertToSlug");

const Schema = mongoose.Schema;

const guideSchema = new Schema({
    title: { type: String, required: true },
    thumbnail: { type: String },
    content: { type: String, required: true },
    description: { type: String },
    info: { type: String },
    category: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Category_guide",
    },
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

guideSchema.index({
    title: "text",
    content: "text",
    description: "text",
    info: "text",
});

guideSchema.virtual("slug").get(function () {
    return convertToSlug(this.title, this._id);
});

guideSchema.virtual("url-web").get(function () {
    const url = process.env.CLIENT_URL + "/" + "cam-nang" + "/" + this.slug;
    return url;
});

guideSchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret.id;
    }
});

guideSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Guide", guideSchema);
