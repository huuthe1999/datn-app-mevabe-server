const CustomError = require("../models/custom-error");
const mongoose = require("mongoose");
const Child = require("../models/child");
const User = require("../models/user");
const GrowNote = require("../models/grow-note");
const HeightNote = require("../models/height-note");
const WeightNote = require("../models/weight-note");
const MilkNote = require("../models/milk-note");
const Appointment = require("../models/appointment");
const Note = require("../models/note");
const Wean = require("../models/wean");
const Vaccination_shot_child = require("../models/vacination-shot-child");
const Status = require("../models/status");
const Comment = require("../models/comment");

const imagesController = require("./images-controller");

//validator
const { validationResult } = require("express-validator");
const { createWean } = require("./wean-controllers");

const getChildByID = async (req, res, next) => {
    const childId = req.params.cid;

    let child;
    try {
        child = await Child.findById(childId);
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin child thất bại, thử lại!",
            -1101
        );
    }

    if (!child || child.userId != req.jwtDecoded.data.userId) {
        return CustomError(
            res,
            "Không tìm thấy child thuộc user và childId được cung cấp!",
            -1001
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            child,
        },
    });
};

const getChildsByMe = async (req, res, next) => {
    const userId = req.jwtDecoded.data.userId;

    let userWithChildren;
    try {
        userWithChildren = await User.findById(userId).populate("children");
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin children thất bại, thử lại!",
            -2101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            children: userWithChildren ? userWithChildren.children : [],
        },
    });
};

const getChildsByUserID = async (req, res, next) => {
    const userId = req.params.uid;

    let userWithChildren;
    try {
        userWithChildren = await User.findById(userId).populate("children");
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin children thất bại, thử lại!",
            -3101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            children: userWithChildren ? userWithChildren.children : [],
        },
    });
};

const createChild = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];

        return CustomError(res, firstError, -5001);
    }

    const { name, gender, birthday, nickname, avatar, avatar_background } =
        req.body;

    const userId = req.jwtDecoded.data.userId;

    if (!userId) {
        return CustomError(res, "Thêm bé mới thất bại, thử lại!", -5002);
    }

    const createdChild = new Child({
        userId,
        name,
        gender,
        birthday,
        nickname,
        avatar,
        avatar_background,
        grow_notes: [],
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let user;

    try {
        user = await User.findById(userId);
    } catch (err) {
        return CustomError(res, "Thêm bé mới thất bại, thử lại!", -5103);
    }

    if (!user) {
        return CustomError(res, "Thêm bé mới thất bại, thử lại!", -5003);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdChild.save({ session: sess });
        user.children.push(createdChild);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        return CustomError(res, "Thêm bé mới thất bại, thử lại!", -5102);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            createdChild,
        },
    });
};

const updateChildByID = async (req, res, next) => {
    const childId = req.params.cid;

    let child;
    try {
        child = await Child.findById(childId);
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin child thất bại, thử lại!",
            -4101
        );
    }

    if (!child) {
        return CustomError(
            res,
            "Không tìm thấy child từ childId được cung cấp!",
            -4001
        );
    }

    const { name, gender, birthday, nickname, avatar, avatar_background } =
        req.body;

    if (avatar && avatar != child.avatar) {
        try {
            await imagesController.deleteImageOnCloudinary(child.avatar);
        } catch (err) {
            return CustomError(
                res,
                "Không thể cập nhập thông tin! Thử lại",
                -4201
            ); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    if (avatar_background && avatar_background != child.avatar_background) {
        try {
            await imagesController.deleteImageOnCloudinary(
                child.avatar_background
            );
        } catch (err) {
            return CustomError(
                res,
                "Không thể cập nhập thông tin! Thử lại",
                -4201
            ); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    child.name = typeof name !== "undefined" ? name : child.name;
    child.nickname =
        typeof nickname !== "undefined" ? nickname : child.nickname;
    child.birthday =
        typeof birthday !== "undefined" ? birthday : child.birthday;
    child.gender = typeof gender !== "undefined" ? gender : child.gender;
    child.avatar = typeof avatar !== "undefined" ? avatar : child.avatar;
    child.avatar_background =
        typeof avatar_background !== "undefined"
            ? avatar_background
            : child.avatar_background;
    child.updateAt = new Date().getTime();

    try {
        await child.save();
        res.json({
            message: "Success",
            status: 200,
            data: {
                child,
            },
        });
    } catch (error) {
        return CustomError(res, "Cập nhật thất bại, thử lại!", -4102);
    }
};

const removeChildById = async (req, res, next) => {
    const childId = req.params.cid;
    const userId = req.jwtDecoded.data.userId;
    let statusOfChildList;

    if (!childId) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6001);
    }

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6101);
    }

    try {
        await Child.findOneAndRemove({ _id: childId, userId: userId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6102);
    }

    try {
        await User.findOneAndUpdate(
            { _id: userId },
            {
                $pull: {
                    children: childId,
                },
                updateAt: new Date().getTime(),
            }
        );
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6103);
    }

    try {
        await GrowNote.deleteMany({ childId: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6104);
    }

    try {
        await HeightNote.deleteMany({ childId: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6105);
    }

    try {
        await WeightNote.deleteMany({ childId: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6106);
    }

    try {
        await MilkNote.deleteMany({ childId: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6107);
    }

    try {
        await Appointment.deleteMany({ childId: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6108);
    }

    try {
        await Note.deleteMany({ childId: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6109);
    }

    try {
        await Wean.deleteMany({ child: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6110);
    }

    try {
        await Vaccination_shot_child.deleteMany({ childId: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6111);
    }

    try {
        statusOfChildList = await Status.find({ child: childId });
    } catch (err) {
        return CustomError(res, "Xóa bé thất bại, thử lại!", -6112);
    }

    if (statusOfChildList && statusOfChildList.length > 0) {
        statusOfChildList.map(async (status) => {
            try {
                await Status.findOneAndRemove({ child: status.child });
            } catch (error) {
                return CustomError(res, "Xóa bé thất bại, thử lại!", -6113);
            }

            if (status.images && status.images.length > 0) {
                try {
                    status.images.map(
                        async (item) =>
                            await imagesController.deleteImageOnCloudinary(item)
                    );
                } catch (err) {
                    return CustomError(res, "Xóa bé thất bại, thử lại!", -6201); //Lỗi xoá ảnh cũ trên cloudinary
                }
            }

            if (status.comments && status.comments.length > 0) {
                try {
                    status.comments.map(
                        async (item) => await Comment.deleteMany({ _id: item })
                    );
                } catch (err) {
                    return CustomError(res, "Xóa bé thất bại, thử lại!", -6114);
                }
            }
        });
    }

    res.json({
        message: "Success",
        status: 200,
    });
};

exports.createChild = createChild;
exports.getChildByID = getChildByID;
exports.updateChildByID = updateChildByID;
exports.getChildsByUserID = getChildsByUserID;
exports.getChildsByMe = getChildsByMe;
exports.removeChildById = removeChildById;
