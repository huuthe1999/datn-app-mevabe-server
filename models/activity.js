const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const activitySchema = new Schema({
    child: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Children",
    },
    date: { type: Number, default: new Date().getTime(), required: true },
    startTime: { type: Number },
    endTime: { type: Number },
    active: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6],
        default: 0,
        required: true,
    },
    rating: {
        type: Number,
        enum: [0, 1, 2, 3], //"Rất thích", "Hơi thích", "Bình thường", "Không thích"
        default: 0,
    },
    note: { type: String },
    images: [{ type: String }],
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

activitySchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret.id;
    },
});

activitySchema.plugin(uniqueValidator);

module.exports = mongoose.model("Activity", activitySchema);
