/** @format */

const CustomError = require("../models/custom-error");
const Child = require("../models/child");
const User = require("../models/user");
const Status = require("../models/status");
const Comment = require("../models/comment");
const imagesController = require("./images-controller");
const Notification = require("../helpers/pusher-admin.js");

//validator
const { validationResult } = require("express-validator");

const createHighLevelComment = async (req, res, next) => {
    const statusId = req.params.sid;
    const userId = req.jwtDecoded.data.userId;
    let status;

    if (!statusId) {
        return CustomError(res, "Tạo bình luận thất bại ! Thử lại", -1001);
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -1103);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];

        return CustomError(res, firstError, -1002);
    }

    const { content, arrImg } = req.body;
    let newComment = new Comment({
        user: userId,
        status: statusId,
        content,
        images: arrImg,
        subComments: [],
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    try {
        status = await Status.findOneAndUpdate(
            { _id: statusId },
            {
                $inc: {
                    countComment: 1,
                },
                $push: {
                    comments: newComment._id,
                },
                updateAt: new Date().getTime(),
            },
            { returnOriginal: false }
        );
    } catch (error) {
        return CustomError(res, "Tạo bình luận thất bại ! Thử lại", -1101);
    }

    if (status) {
        try {
            newComment = await newComment.save();
            newComment = await Comment.populate(newComment, {
                path: "user",
                select: "-password",
            });
        } catch (err) {
            return CustomError(res, "Tạo bình luận thất bại, thử lại!", -1102);
        }

        const user = await User.findById(userId);

        let userIdSendNotify = status.user._id || status.user;
        userIdSendNotify = "" + userIdSendNotify;

        if (userIdSendNotify !== userId) {
            Notification.beamsPushNotificationToUsers(
                [userIdSendNotify],
                "Mẹ và bé",
                user.name + " đã bình luận bài viết của bạn",
                {
                    ACTION: 101,
                    STATUS_ID: status._id,
                }
            );
        }

        res.json({
            message: "Success",
            status: 200,
            data: {
                newComment,
            },
        });
    } else {
        return CustomError(res, "Tạo bình luận thất bại ! Thử lại", -1003);
    }
};

const createLowLevelComment = async (req, res, next) => {
    const statusId = req.params.sid;
    const commentId = req.params.cid;
    const userId = req.jwtDecoded.data.userId;

    if (!statusId) {
        return CustomError(res, "Tạo bình luận thất bại ! Thử lại", -2001);
    }

    if (!commentId) {
        return CustomError(res, "Tạo bình luận thất bại ! Thử lại", -2002);
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -2104);
    }

    try {
        if ((await Comment.exists({ _id: commentId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -2105);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];
        return CustomError(res, firstError, -2003);
    }

    const { content, arrImg } = req.body;
    const newComment = new Comment({
        user: userId,
        status: statusId,
        content,
        images: arrImg,
        subComments: [],
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let comment;
    try {
        comment = await Comment.findOneAndUpdate(
            { _id: commentId },
            {
                $push: {
                    subComments: newComment._id,
                },
                updateAt: new Date().getTime(),
            },
            { returnOriginal: false }
        );
    } catch (err) {
        return CustomError(res, "Tạo bình luận thất bại, thử lại!", -2101);
    }

    if (comment) {
        try {
            await newComment.save();
            await Comment.populate(newComment, {
                path: "user",
                select: "-password",
            });
        } catch (err) {
            return CustomError(res, "Tạo bình luận thất bại, thử lại!", -2102);
        }

        let status;

        try {
            status = await Status.findOneAndUpdate(
                { _id: statusId },
                {
                    $inc: {
                        countComment: 1,
                    },
                    updateAt: new Date().getTime(),
                },
                { returnOriginal: false }
            );
        } catch (err) {
            return CustomError(res, "Tạo bình luận thất bại, thử lại!", -2103);
        }

        const user = await User.findById(userId);

        let userIdSendNotify = status.user._id || status.user;
        userIdSendNotify = "" + userIdSendNotify;

        if (userIdSendNotify !== userId) {
            Notification.beamsPushNotificationToUsers(
                [userIdSendNotify],
                "Mẹ và bé",
                user.name + " đã bình luận bài viết của bạn",
                {
                    ACTION: 101,
                    STATUS_ID: status._id,
                }
            );
        }


        userIdSendNotify = comment.user._id || comment.user;
        userIdSendNotify = "" + userIdSendNotify;
        if (userIdSendNotify !== userId) {
            Notification.beamsPushNotificationToUsers(
                [userIdSendNotify],
                "Mẹ và bé",
                user.name + " đã trả lời bình luận của bạn",
                {
                    ACTION: 101,
                    STATUS_ID: status._id,
                }
            );
        }

        res.json({
            message: "Success",
            status: 200,
            data: {
                newComment,
            },
        });
    } else {
        return CustomError(res, "Tạo bình luận thất bại ! Thử lại", -2004);
    }
};

const getHighLevelComment = async (req, res, next) => {
    const statusId = req.params.sid;
    let comments = [];

    if (!statusId) {
        return CustomError(res, "Truy cập bình luận thất bại ! Thử lại", -3001);
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Cập nhật bình luận thất bại ! Thử lại", -3102);
    }

    try {
        comments = await Status.findOne({ _id: statusId }, "comments -_id")
            .lean()
            .populate({
                path: "comments",
                populate: [
                    //   {
                    //   path: "subComments",
                    //   populate: {
                    //     path: "user",
                    //     select: "-password"
                    //   }
                    // },
                    {
                        path: "user",
                        select: "-password",
                    },
                ],
            });
    } catch (error) {
        return CustomError(res, "Truy cập bình luận thất bại ! Thử lại", -3101);
    }

    comments = comments.comments;

    res.json({
        message: "Success",
        status: 200,
        data: {
            comments: comments ? comments : [],
        },
    });
};

const getLowLevelComment = async (req, res, next) => {
    const commentId = req.params.cid;
    let comments;

    if (!commentId) {
        return CustomError(res, "Truy cập bình luận thất bại ! Thử lại", -4001);
    }

    try {
        if ((await Comment.exists({ _id: commentId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -4105);
    }

    try {
        comments = await Comment.findOne({ _id: commentId })
            .lean()
            .populate({
                path: "subComments",
                populate: {
                    path: "user",
                    select: "-password",
                },
            });
    } catch (error) {
        return CustomError(res, "Truy cập bình luận thất bại ! Thử lại", -4101);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            comments,
        },
    });
};

const getAllComment = async (req, res, next) => {
    const statusId = req.params.sid;
    let comments;

    if (!statusId) {
        return CustomError(res, "Truy cập bình luận thất bại ! Thử lại", -5001);
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Cập nhật bình luận thất bại ! Thử lại", -5102);
    }

    try {
        comments = await Status.findOne({ _id: statusId }, "comments -_id")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "subComments",
                        populate: [
                            {
                                path: "user",
                                select: "-password",
                            },
                        ],
                    },
                    {
                        path: "user",
                        select: "-password",
                    },
                ],
            })
            .lean();
    } catch (error) {
        return CustomError(res, "Truy cập bình luận thất bại ! Thử lại", -5101);
    }

    comments = comments.comments;

    res.json({
        message: "Success",
        status: 200,
        data: {
            comments: comments ? comments : [],
        },
    });
};

const updateComment = async (req, res, next) => {
    const commentId = req.params.cid;
    const userId = req.jwtDecoded.data.userId;
    let comment;

    if (!commentId) {
        return CustomError(res, "Cập nhật bình luận thất bại ! Thử lại", -6001);
    }

    try {
        if ((await Comment.exists({ _id: commentId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Cập nhật bình luận thất bại ! Thử lại", -6103);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];
        return CustomError(res, firstError, -6002);
    }

    const { content, arrImg } = req.body;

    try {
        comment = await Comment.findById(commentId);
    } catch (err) {
        return CustomError(res, "Cập nhật bình luận thất bại, thử lại!", -6101);
    }

    if (userId != comment.user) {
        return CustomError(res, "Cập nhật bình luận thất bại, thử lại!", -6003);
    }

    comment.content =
        typeof content !== "undefined" ? content : comment.content;
    comment.images = typeof arrImg !== "undefined" ? arrImg : comment.images;
    comment.updateAt = new Date().getTime();

    try {
        await comment.save();
        await Comment.populate(comment, {
            path: "user",
            select: "-password",
        });
    } catch (err) {
        return CustomError(res, "Cập nhật bình luận thất bại, thử lại!", -6102);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            comment,
        },
    });
};

const removeHighLevelComment = async (req, res, next) => {
    const commentId = req.params.cid;
    let comment,
        arrImg = [];

    if (!commentId) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -7001);
    }

    try {
        if ((await Comment.exists({ _id: commentId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -7104);
    }

    try {
        comment = await Comment.findOneAndRemove({ _id: commentId });
        if (comment.images && comment.images.length > 0) {
            arrImg = [...comment.images];
        }
    } catch (err) {
        return CustomError(res, "Xóa bình luận thất bại, thử lại!", -7101);
    }

    let imagesPromise;
    if (comment) {
        if (comment.comments && comment.comments.length > 0) {
            imagesPromise = Promise.all(
                comment.comments.map(async (item) => {
                    try {
                        const comment = await Comment.findOneAndRemove({
                            _id: item,
                        }); //Xóa comment cấp 2
                        const images = comment.images;
                        if (images && images.length > 0) {
                            arrImg = [...arrImg, ...images];
                            return Promise.resolve(arrImg);
                        }
                    } catch (error) {
                        return CustomError(
                            res,
                            "Xóa khoảnh khắc thất bại ! Thử lại",
                            -7102
                        );
                    }
                })
            );
        }
        await imagesPromise;

        if (arrImg && arrImg.length > 0) {
            imagesPromise = Promise.all(
                arrImg.map(async (item) => {
                    try {
                        await imagesController.deleteImageOnCloudinary(item);
                    } catch (error) {
                        return CustomError(
                            res,
                            "Xóa khoảnh khắc thất bại ! Thử lại",
                            -7201
                        ); //Lỗi xoá ảnh cũ trên cloudinary
                    }
                })
            );
        }
        await imagesPromise;

        try {
            await Status.findOneAndUpdate(
                { _id: comment.status },
                {
                    $pull: {
                        comments: comment._id,
                    },
                    $inc: {
                        countComment: -(comment.subComments.length + 1),
                    },
                    updateAt: new Date().getTime(),
                }
            );
            res.json({
                message: "Success",
                status: 200,
            });
        } catch (err) {
            return CustomError(res, "Xóa bình luận thất bại, thử lại!", -7103);
        }
    } else {
        return CustomError(res, "Xóa bình luận thất bại, thử lại!", -7002);
    }
};

const removeLowLevelComment = async (req, res, next) => {
    const highCommentId = req.params.hid;
    const lowCommentId = req.params.lid;
    let comment;

    if (!highCommentId) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -8001);
    }

    if (!lowCommentId) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -8002);
    }

    try {
        if ((await Comment.exists({ _id: highCommentId })) == false)
            throw error;
    } catch (error) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -8104);
    }

    try {
        if ((await Comment.exists({ _id: lowCommentId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bình luận thất bại ! Thử lại", -8105);
    }

    try {
        comment = await Comment.findOneAndRemove({ _id: lowCommentId });
    } catch (err) {
        return CustomError(res, "Xóa bình luận thất bại, thử lại!", -8101);
    }

    if (comment) {
        if (comment.images && comment.images.length > 0) {
            imagesPromise = Promise.all(
                comment.images.map(async (item) => {
                    try {
                        await imagesController.deleteImageOnCloudinary(item);
                    } catch (error) {
                        return CustomError(
                            res,
                            "Xóa khoảnh khắc thất bại ! Thử lại",
                            -8201
                        ); //Lỗi xoá ảnh cũ trên cloudinary
                    }
                })
            );
            await imagesPromise;
        }

        try {
            await Comment.findOneAndUpdate(
                { _id: highCommentId },
                {
                    $pull: {
                        subComments: lowCommentId,
                    },
                    updateAt: new Date().getTime(),
                },
                { returnOriginal: false }
            );
        } catch (err) {
            return CustomError(res, "Xóa bình luận thất bại, thử lại!", -8102);
        }

        try {
            await Status.findOneAndUpdate(
                { _id: comment.status },
                {
                    $inc: {
                        countComment: -1,
                    },
                    updateAt: new Date().getTime(),
                },
                { returnOriginal: false }
            );
        } catch (err) {
            return CustomError(res, "Xóa bình luận thất bại, thử lại!", -8103);
        }

        res.json({
            message: "Success",
            status: 200,
        });
    } else {
        return CustomError(res, "Xóa bình luận thất bại, thử lại!", -8003);
    }
};

exports.createHighLevelComment = createHighLevelComment;
exports.createLowLevelComment = createLowLevelComment;
exports.getHighLevelComment = getHighLevelComment;
exports.getLowLevelComment = getLowLevelComment;
exports.getAllComment = getAllComment;
exports.updateComment = updateComment;
exports.removeHighLevelComment = removeHighLevelComment;
exports.removeLowLevelComment = removeLowLevelComment;
