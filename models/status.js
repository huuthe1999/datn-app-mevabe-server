/** @format */

const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { convertToSlug } = require("../helpers/convertToSlug");

const Schema = mongoose.Schema;

const statusSchema = new Schema({
    user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    child: { type: mongoose.Types.ObjectId, required: true, ref: "Children" },
    title: { type: String, required: true },
    images: [{ type: String }],
    description: { type: String },
    countComment: { type: Number, default: 0 },
    countLike: { type: Number, default: 0 },
    comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
    likeUsers: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    userHiddens: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    createAt: { type: Number, default: new Date().getTime() },
    updateAt: { type: Number, default: new Date().getTime() },
});

statusSchema.virtual("url-web").get(function () {
    const url = process.env.CLIENT_URL + "/" + "khoanh-khac" + "/" + this._id;
    return url;
});

statusSchema.virtual("point").get(function () {
    let pointPerLike = Number(process.env.POINT_PER_LIKE);
    let pointPerComment = Number(process.env.POINT_PER_COMMENT);
    let pointPerDay = Number(process.env.POINT_PER_DATE);

    let maxLikePoint = Number(process.env.MAX_LIKE_POINT);
    let maxCommentPoint = Number(process.env.MAX_COMMENT_POINT);
    let maxDatePoint = Number(process.env.MAX_DAY_POINT);

    let point = 0;
    let pointLike = this.countLike * pointPerLike;
    let pointComment = this.countComment * pointPerComment;
    let pointDate = parseInt((new Date().getTime() - this.createAt) / 86400000) * pointPerDay;

    if(pointLike > maxLikePoint) pointLike = maxLikePoint;
    if(pointComment > maxCommentPoint) pointComment = maxCommentPoint;
    if(pointDate > maxDatePoint) pointDate = maxDatePoint;

    point = pointLike + pointComment - pointDate;

    return point;
});

statusSchema.set("toJSON", {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.id;
    },
});

statusSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Status", statusSchema);
