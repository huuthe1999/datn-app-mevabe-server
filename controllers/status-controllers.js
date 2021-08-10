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

const createStatus = async (req, res, next) => {
    const childId = req.params.cid;
    const userId = req.jwtDecoded.data.userId;

    if (!childId) {
        return CustomError(res, "Tạo khoảnh khắc thất bại ! Thử lại", -1001);
    }

    if (!userId) {
        return CustomError(res, "Tạo khoảnh khắc thất bại ! Thử lại", -1002);
    }

    try {
        if ((await User.exists({ _id: userId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Tạo khoảnh khắc thất bại ! Thử lại", -1101);
    }

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Tạo khoảnh khắc thất bại ! Thử lại", -1102);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];

        return CustomError(res, firstError, -1003);
    }

    const { title, description, arrImg } = req.body;

    let newStatus = new Status({
        user: userId,
        child: childId,
        title,
        images: arrImg,
        description,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });
    try {
        await newStatus.save();

        await newStatus
            .populate("user", "-children -password")
            .populate("child", "-grow_notes")
            .execPopulate();
    } catch (err) {
        return CustomError(res, "Tạo khoảnh khắc thất bại, thử lại!", -1103);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            status: newStatus,
        },
    });
};

const getAllStatusByChildId = async (req, res, next) => {
    const childId = req.params.cid;
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let { sortBy } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const userId = req.jwtDecoded.data.userId;

    const statusList = {};

    if (!childId) {
        return CustomError(
            res,
            "Lấy thông tin status thất bại, thử lại!",
            -2001
        );
    }

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(
            res,
            "Lấy thông tin status thất bại, thử lại!",
            -2102
        );
    }

    let totalDocuments = await Status.countDocuments({
        user: userId,
        child: childId,
    }).exec();

    if (Number.isNaN(totalDocuments)) {
        totalDocuments = 0;
    }

    if (Number.isNaN(limit)) {
        limit = totalDocuments;
    }

    if (Number.isNaN(page)) {
        page = 1;
    }

    statusList.currentPage = {
        page: page,
        limit: limit,
    };

    statusList.totalPages = limit == 0 ? 0 : Math.ceil(totalDocuments / limit);
    statusList.totalRecords = totalDocuments;

    if (startIndex > 0) {
        statusList.previous = {
            page: page - 1,
            limit: limit,
        };
    }

    if (endIndex < totalDocuments) {
        statusList.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (sortBy) {
        if (sortBy == "favourite") {
            try {
                statusList.status = await Status.find({
                    user: userId,
                    child: childId,
                })
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countLike: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -2103
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        } else if (sortBy == "popular") {
            try {
                statusList.status = await Status.find({
                    user: userId,
                    child: childId,
                })
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countComment: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -2104
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        }
    }

    try {
        statusList.status = await Status.find({
            user: userId,
            child: childId,
        })
            .skip(startIndex)
            .limit(limit)
            .populate("user", "-children -password")
            .populate("child", "-grow_notes")
            .sort({ createAt: -1 })
            .exec();
    } catch (error) {
        return CustomError(
            res,
            "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
            -2101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            statusList: statusList ? statusList : [],
        },
    });
};

const getStatusById = async (req, res, next) => {
    const statusId = req.params.sid;

    if (!statusId) {
        return CustomError(
            res,
            "Lấy thông tin status thất bại, thử lại!",
            -3001
        );
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(
            res,
            "Lấy thông tin status thất bại, thử lại!",
            -3101
        );
    }

    let status;
    try {
        status = await Status.findById(statusId)
            .populate("user", "-children -password")
            .populate("child", "-grow_notes");
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin status thất bại, thử lại!",
            -3102
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            status: status ? status : [],
        },
    });
};

const likeStatus = async (req, res, next) => {
    const userId = req.jwtDecoded.data.userId;
    const statusId = req.params.sid;

    if (!userId) {
        return CustomError(res, "Like status thất bại, thử lại!", -4001);
    }

    if (!statusId) {
        return CustomError(res, "Like status thất bại, thử lại!", -4002);
    }

    let isExistUser;
    let status;

    try {
        isExistUser = await Status.exists({
            $and: [
                {
                    _id: statusId,
                    likeUsers: userId,
                },
            ],
        });
    } catch (error) {
        return CustomError(res, "Like status thất bại, thử lại!", -4101);
    }

    if (isExistUser) {
        try {
            status = await Status.findOne({ _id: statusId })
                .populate("user", "-children -password")
                .populate("child", "-grow_notes");

            res.json({
                message: "Success",
                status: 200,
                data: {
                    status,
                },
            });
        } catch (err) {
            return CustomError(res, "Like status thất bại, thử lại!", -4102);
        }
    } else {
        try {
            status = await Status.findOneAndUpdate(
                { _id: statusId },
                {
                    $push: {
                        likeUsers: userId,
                    },
                    $inc: {
                        countLike: 1,
                    },
                },
                { returnOriginal: false }
            )
                .populate("user", "-children -password")
                .populate("child", "-grow_notes");

            const user = await User.findById(userId);

            let userIdSendNotify = status.user._id || status.user;
            userIdSendNotify = "" + userIdSendNotify ;

            if(userIdSendNotify !== userId){
                Notification.beamsPushNotificationToUsers([userIdSendNotify], "Mẹ và bé", user.name + " đã yêu thích bài viết của bạn", {
                    ACTION: 101,
                    STATUS_ID: status._id,
                });
            }

            res.json({
                message: "Success",
                status: 200,
                data: {
                    status,
                },
            });
        } catch (err) {
            return CustomError(res, "Like status thất bại, thử lại!", -4103);
        }
    }
};

const dislikeStatus = async (req, res, next) => {
    const userId = req.jwtDecoded.data.userId;
    const statusId = req.params.sid;

    if (!userId) {
        return CustomError(res, "Dislike status thất bại, thử lại!", -5001);
    }

    if (!statusId) {
        return CustomError(res, "Dislike status thất bại, thử lại!", -5002);
    }

    let isExistUser;
    let status;

    try {
        isExistUser = await Status.exists({
            $and: [
                {
                    _id: statusId,
                    likeUsers: userId,
                },
            ],
        });
    } catch (error) {
        return CustomError(res, "Like status thất bại, thử lại!", -5101);
    }
    if (isExistUser) {
        try {
            status = await Status.findOneAndUpdate(
                { _id: statusId },
                {
                    $pull: {
                        likeUsers: userId,
                    },
                    $inc: {
                        countLike: -1,
                    },
                },
                { returnOriginal: false }
            )
                .populate("user", "-children -password")
                .populate("child", "-grow_notes");

            res.json({
                message: "Success",
                status: 200,
                data: {
                    status,
                },
            });
        } catch (err) {
            return CustomError(res, "Like status thất bại, thử lại!", -5103);
        }
    } else {
        try {
            status = await Status.findOne({ _id: statusId })
                .populate("user", "-children -password")
                .populate("child", "-grow_notes");
            res.json({
                message: "Success",
                status: 200,
                data: {
                    status,
                },
            });
        } catch (err) {
            return CustomError(res, "Like status thất bại, thử lại!", -5102);
        }
    }
};

const updateStatus = async (req, res, next) => {
    const statusId = req.params.sid;
    const userId = req.jwtDecoded.data.userId;

    if (!statusId) {
        return CustomError(
            res,
            "Cập nhật khoảnh khắc thất bại ! Thử lại",
            -6001
        );
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(
            res,
            "Cập nhật khoảnh khắc thất bại ! Thử lại",
            -6102
        );
    }

    let status;
    try {
        status = await Status.findOne({ _id: statusId })
            .populate("user", "-children -password")
            .populate("child", "-grow_notes");
    } catch (error) {
        return CustomError(
            res,
            "Cập nhật khoảnh khắc thất bại ! Thử lại",
            -6101
        );
    }

    if (status.user._id != userId) {
        return CustomError(
            res,
            "Cập nhật khoảnh khắc thất bại ! Thử lại",
            -6002
        );
    }

    const { title, description, arrImg } = req.body;
    let imgArrUrlRemove;

    if (arrImg) {
        imgArrUrlRemove = status.images.filter(
            (item1) => !arrImg.some((item2) => item2 === item1)
        );
        try {
            imgArrUrlRemove.map(
                async (item) =>
                    await imagesController.deleteImageOnCloudinary(item)
            );
        } catch (err) {
            return CustomError(
                res,
                "Cập nhật khoảnh khắc thất bại ! Thử lại",
                -6201
            ); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    status.title = typeof title !== "undefined" ? title : status.title;
    status.images = typeof arrImg !== "undefined" ? arrImg : status.images;
    status.description =
        typeof description !== "undefined" ? description : status.description;
    status.updateAt = new Date().getTime();

    try {
        await status.save();
        res.json({
            message: "Success",
            status: 200,
            data: {
                status,
            },
        });
    } catch (err) {
        return CustomError(
            res,
            "Cập nhật khoảnh khắc thất bại, thử lại!",
            -6102
        );
    }
};

const removeStatus = async (req, res, next) => {
    const statusId = req.params.sid;

    if (!statusId) {
        return CustomError(res, "Xóa khoảnh khắc thất bại ! Thử lại", -7001);
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa khoảnh khắc thất bại ! Thử lại", -7102);
    }

    let status;
    try {
        status = await Status.findOneAndRemove({ _id: statusId });
    } catch (error) {
        return CustomError(res, "Xóa khoảnh khắc thất bại ! Thử lại", -7101);
    }

    if (status.images && status.images.length > 0) {
        try {
            status.images.map(
                async (item) =>
                    await imagesController.deleteImageOnCloudinary(item)
            );
        } catch (err) {
            return CustomError(
                res,
                "Xóa khoảnh khắc thất bại ! Thử lại",
                -7201
            ); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    if (status.comments && status.comments.length > 0) {
        try {
            status.comments.map(
                async (item) => await Comment.deleteMany({ _id: item })
            );
        } catch (err) {
            return CustomError(
                res,
                "Xóa khoảnh khắc thất bại ! Thử lại",
                -7102
            );
        }
    }

    res.json({
        message: "Success",
        status: 200,
    });
};

const getAllLikersStatus = async (req, res, next) => {
    const statusId = req.params.sid;

    if (!statusId) {
        return CustomError(
            res,
            "Lấy thông tin khoảnh khắc thất bại ! Thử lại",
            -8001
        );
    }

    try {
        if ((await Status.exists({ _id: statusId })) == false) throw error;
    } catch (error) {
        return CustomError(
            res,
            "Lấy thông tin khoảnh khắc thất bại ! Thử lại",
            -8102
        );
    }

    let userList;
    try {
        userList = await Status.findOne({ _id: statusId }, "likeUsers -_id")
            .populate("likeUsers", "-password")
            .lean();
    } catch (error) {
        return CustomError(
            res,
            "Lấy thông tin khoảnh khắc thất bại ! Thử lại",
            -8101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            userList: userList ? userList : [],
        },
    });
};

const getStatus = async (req, res, next) => {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let { sortBy } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let totalDocuments = await Status.countDocuments().exec();
    const statusList = {};

    if (Number.isNaN(totalDocuments)) {
        totalDocuments = 0;
    }

    if (Number.isNaN(limit)) {
        limit = totalDocuments;
    }

    if (Number.isNaN(page)) {
        page = 1;
    }

    statusList.currentPage = {
        page: page,
        limit: limit,
    };

    statusList.totalPages = limit == 0 ? 0 : Math.ceil(totalDocuments / limit);
    statusList.totalRecords = totalDocuments;

    if (startIndex > 0) {
        statusList.previous = {
            page: page - 1,
            limit: limit,
        };
    }

    if (endIndex < totalDocuments) {
        statusList.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (sortBy) {
        if (sortBy == "favourite") {
            try {
                statusList.status = await Status.find()
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countLike: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -9101
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        } else if (sortBy == "popular") {
            try {
                statusList.status = await Status.find()
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countComment: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -9102
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        }
    }

    try {
        statusList.status = await Status.find()
            .populate("user", "-children -password")
            .populate("child", "-grow_notes")
            .exec();
    } catch (error) {
        return CustomError(
            res,
            "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
            -9103
        );
    }

    statusList.status.sort((a, b) => (a.point > b.point) ? -1 : (a.point === b.point) ? ((a.createAt > b.createAt) ? -1 : 1) : 1 )

    statusList.status = statusList.status.slice(startIndex, startIndex + limit);

    res.json({
        message: "Success",
        status: 200,
        data: {
            statusList: statusList ? statusList : [],
        },
    });
};

const getAllStatusByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let { sortBy } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const statusList = {};

    if (!userId) {
        return CustomError(res, "Lấy khoảnh khắc thất bại ! Thử lại", -10001);
    }

    try {
        if ((await User.exists({ _id: userId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Lấy khoảnh khắc thất bại ! Thử lại", -10102);
    }

    let totalDocuments = await Status.countDocuments({
        user: userId,
    }).exec();

    if (Number.isNaN(totalDocuments)) {
        totalDocuments = 0;
    }

    if (Number.isNaN(limit)) {
        limit = totalDocuments;
    }

    if (Number.isNaN(page)) {
        page = 1;
    }

    statusList.currentPage = {
        page: page,
        limit: limit,
    };

    statusList.totalPages = limit == 0 ? 0 : Math.ceil(totalDocuments / limit);
    statusList.totalRecords = totalDocuments;

    if (startIndex > 0) {
        statusList.previous = {
            page: page - 1,
            limit: limit,
        };
    }

    if (endIndex < totalDocuments) {
        statusList.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (sortBy) {
        if (sortBy == "favourite") {
            try {
                statusList.status = await Status.find({
                    user: userId,
                })
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countLike: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -10103
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        } else if (sortBy == "popular") {
            try {
                statusList.status = await Status.find({
                    user: userId,
                })
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countComment: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -10104
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        }
    }

    try {
        statusList.status = await Status.find({
            user: userId,
        })
            .skip(startIndex)
            .limit(limit)
            .populate("user", "-children -password")
            .populate("child", "-grow_notes")
            .sort({ createAt: -1 })
            .exec();
    } catch (error) {
        return CustomError(
            res,
            "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
            -10101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            statusList: statusList ? statusList : [],
        },
    });
};

const filterStatusHidden = async (req, res, next) => {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let { sortBy } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const userId = req.jwtDecoded.data.userId;
    let totalDocuments = await Status.countDocuments({
        userHiddens: {
            $nin: [userId],
        },
    }).exec();
    const statusList = {};

    if (Number.isNaN(totalDocuments)) {
        totalDocuments = 0;
    }

    if (Number.isNaN(limit)) {
        limit = totalDocuments;
    }

    if (Number.isNaN(page)) {
        page = 1;
    }

    statusList.currentPage = {
        page: page,
        limit: limit,
    };

    statusList.totalPages = limit == 0 ? 0 : Math.ceil(totalDocuments / limit);
    statusList.totalRecords = totalDocuments;

    if (startIndex > 0) {
        statusList.previous = {
            page: page - 1,
            limit: limit,
        };
    }

    if (endIndex < totalDocuments) {
        statusList.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (sortBy) {
        if (sortBy == "favourite") {
            try {
                statusList.status = await Status.find({
                    userHiddens: {
                        $nin: [userId],
                    },
                })
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countLike: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -11101
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        } else if (sortBy == "popular") {
            try {
                statusList.status = await Status.find({
                    userHiddens: {
                        $nin: [userId],
                    },
                })
                    .skip(startIndex)
                    .limit(limit)
                    .populate("user", "-children -password")
                    .populate("child", "-grow_notes")
                    .sort({ countComment: -1, createAt: -1 })
                    .exec();
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
                    -11102
                );
            }
            return res.json({
                message: "Success",
                status: 200,
                data: {
                    statusList: statusList ? statusList : [],
                },
            });
        }
    }

    try {
        statusList.status = await Status.find({
            userHiddens: {
                $nin: [userId],
            },
        })
            .populate("user", "-children -password")
            .populate("child", "-grow_notes")
            .exec();
    } catch (error) {
        return CustomError(
            res,
            "Lấy tất cả khoảnh khắc thất bại ! Thử lại",
            -11103
        );
    }

    statusList.status.sort((a, b) => (a.point > b.point) ? -1 : (a.point === b.point) ? ((a.createAt > b.createAt) ? -1 : 1) : 1 )

    statusList.status = statusList.status.slice(startIndex, startIndex + limit);

    res.json({
        message: "Success",
        status: 200,
        data: {
            statusList: statusList ? statusList : [],
        },
    });
};

const addStatusHidden = async (req, res, next) => {
    const { idStatusHidden, idOwnerHidden } = req.query;
    const userId = req.jwtDecoded.data.userId;
    let statusList;

    if (idStatusHidden) {
        try {
            if ((await Status.exists({ _id: idStatusHidden })) == false)
                throw error;
        } catch (error) {
            return CustomError(
                res,
                "Ẩn khoảnh khắc thất bại ! Thử lại",
                -12101
            );
        }

        try {
            await Status.findOneAndUpdate(
                { _id: idStatusHidden },
                {
                    $addToSet: {
                        userHiddens: userId,
                    },
                }
            );
        } catch (error) {
            return CustomError(
                res,
                "Ẩn khoảnh khắc thất bại ! Thử lại",
                -12102
            );
        }
    }

    if (idOwnerHidden) {
        try {
            if ((await Status.exists({ user: idOwnerHidden })) == false)
                throw error;
        } catch (error) {
            return CustomError(
                res,
                "Ẩn khoảnh khắc thất bại ! Thử lại",
                -12103
            );
        }

        try {
            await Status.updateMany(
                { user: idOwnerHidden },
                {
                    $addToSet: {
                        userHiddens: userId,
                    },
                }
            );
        } catch (error) {
            return CustomError(
                res,
                "Ẩn khoảnh khắc thất bại ! Thử lại",
                -12104
            );
        }

        try {
            await User.findOneAndUpdate(
                { _id: userId },
                {
                    $addToSet: {
                        blockUsers: idOwnerHidden,
                    },
                }
            );
        } catch (error) {
            return CustomError(
                res,
                "Thêm user vào blockUsers thất bại ! Thử lại",
                -12106
            );
        }
    }

    try {
        statusList = await Status.find({
            userHiddens: {
                $nin: [userId],
            },
        })
            .populate("user", "-children -password")
            .populate("child", "-grow_notes")
            .sort({ createAt: -1 })
            .exec();
    } catch (error) {
        return CustomError(
            res,
            "Lọc tất cả khoảnh khắc thất bại ! Thử lại",
            -12105
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            statusList: statusList ? statusList : [],
        },
    });
};

exports.getAllStatusByChildId = getAllStatusByChildId;
exports.createStatus = createStatus;
exports.getStatusById = getStatusById;
exports.likeStatus = likeStatus;
exports.dislikeStatus = dislikeStatus;
exports.updateStatus = updateStatus;
exports.removeStatus = removeStatus;
exports.getAllLikersStatus = getAllLikersStatus;
exports.getAllStatusByUserId = getAllStatusByUserId;
exports.getStatus = getStatus;
exports.filterStatusHidden = filterStatusHidden;
exports.addStatusHidden = addStatusHidden;
