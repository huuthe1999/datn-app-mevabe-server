const CustomError = require("../models/custom-error");
const Activity = require("../models/activity");
const Child = require("../models/child");
const User = require("../models/user");
const imagesController = require("./images-controller");
const validatorDay = require("../helpers/convertDate");
//validator
const { validationResult } = require("express-validator");

const createActivity = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];
        return CustomError(res, firstError, -1001);
    }

    const { childId, date, startTime, endTime, active, note, images, rating } =
        req.body;

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Lưu hoạt động thất bại, thử lại!", -1101);
    }

    let newActivity = new Activity({
        child: childId,
        date,
        active,
        startTime,
        endTime,
    });

    if (typeof note !== "undefined") {
        newActivity.note = note;
    }

    if (typeof rating !== "undefined") {
        newActivity.rating = rating;
    }
    if (images && images.length > 0) {
        newActivity.images = images;
    }

    try {
        await newActivity.save();
        await Activity.populate(newActivity, {
            path: "child",
        });
    } catch (err) {
        return CustomError(res, "Lưu hoạt động thất bại, thử lại!", -1102);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            activity: newActivity,
        },
    });
};

const getActivity = async (req, res, next) => {
    const { activityId, childId } = req.query;
    let activityList = [];

    if (activityId && !childId) {
        try {
            if ((await Activity.exists({ _id: activityId })) == false)
                throw error;
        } catch (error) {
            return CustomError(res, "Lấy hoạt động thất bại, thử lại!", -2101);
        }

        try {
            const activity = await Activity.findById(activityId).populate(
                "child"
            );
            activityList.push(activity);
        } catch (err) {
            return CustomError(res, "Lấy hoạt động thất bại, thử lại!", -2102);
        }
        return res.json({
            message: "Success",
            status: 200,
            data: {
                activityList,
            },
        });
    }

    if (childId && !activityId) {
        try {
            if ((await Child.exists({ _id: childId })) == false) throw error;
        } catch (error) {
            return CustomError(res, "Lấy hoạt động thất bại, thử lại!", -2103);
        }

        try {
            activityList = await Activity.find({ child: childId })
                .lean()
                .sort({ createAt: -1 })
                .populate("child");
        } catch (err) {
            return CustomError(res, "Lấy hoạt động thất bại, thử lại!", -2104);
        }
        return res.json({
            message: "Success",
            status: 200,
            data: {
                activityList,
            },
        });
    }

    const userId = req.jwtDecoded.data.userId;
    let childList = [];
    try {
        childList = await User.findById(userId, "children -_id");
        childList = childList.children;
    } catch (err) {
        return CustomError(res, "Lấy hoạt động thất bại, thử lại!", -2105);
    }

    if (!childList || childList.length == 0) {
        return res.json({
            message: "Success",
            status: 200,
            data: {
                activityList: [],
            },
        });
    }

    let res_promises = childList.map(async (child) => {
        try {
            if ((await Child.exists({ _id: child })) == false) throw error;
        } catch (error) {
            return CustomError(res, "Lấy hoạt động thất bại, thử lại!", -2106);
        }

        try {
            const activeList = await Activity.find({ child: child })
                .lean()
                .sort({ createAt: -1 })
                .populate("child");
            activityList.push(...activeList);
        } catch (err) {
            return CustomError(res, "Lấy hoạt động thất bại, thử lại!", -2107);
        }
    });
    await Promise.all(res_promises);
    return res.json({
        message: "Success",
        status: 200,
        data: {
            activityList,
        },
    });
};

const updateActivity = async (req, res, next) => {
    const activityId = req.params.aid;
    const userId = req.jwtDecoded.data.userId;

    if (!activityId) {
        return CustomError(res, "Cập nhật hoạt động thất bại, thử lại!", -3001);
    }

    try {
        if ((await Activity.exists({ _id: activityId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Cập nhật hoạt động thất bại, thử lại!", -3101);
    }

    let activityResult;
    try {
        activityResult = await Activity.findOne({ _id: activityId }).populate(
            "child"
        );
    } catch (error) {
        return CustomError(res, "Cập nhật hoạt động thất bại, thử lại!", -3102);
    }

    if (activityResult.child.userId != userId) {
        return CustomError(res, "Cập nhật hoạt động thất bại, thử lại!", -3003);
    }

    const { startTime, endTime, active, note, images, rating } = req.body;

    let imgArrUrlRemove;

    if (images && images.length > 0) {
        imgArrUrlRemove = activityResult.images.filter(
            (item1) => !images.some((item2) => item2 === item1)
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
                -3201
            ); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }
    activityResult.date =
        typeof date !== "undefined" ? date : activityResult.date;
    activityResult.startTime =
        typeof startTime !== "undefined" ? startTime : activityResult.startTime;
    activityResult.endTime =
        typeof endTime !== "undefined" ? endTime : activityResult.endTime;

    activityResult.active =
        typeof active !== "undefined" &&
        typeof active == "number" &&
        activityResult.schema.obj.active.enum.includes(active)
            ? active
            : activityResult.active;
    activityResult.note =
        typeof note !== "undefined" ? note : activityResult.note;
    activityResult.rating =
        typeof rating !== "undefined" &&
        typeof rating == "number" &&
        activityResult.schema.obj.rating.enum.includes(rating)
            ? rating
            : activityResult.rating;
    activityResult.images =
        typeof images !== "undefined" && images.length > 0
            ? images
            : activityResult.images;
    activityResult.updateAt = new Date().getTime();

    try {
        await activityResult.save();
        await Activity.populate(activityResult, {
            path: "child",
        });
    } catch (err) {
        return CustomError(res, "Lưu hoạt động thất bại, thử lại!", -3103);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            activity: activityResult,
        },
    });
};

const removeActivity = async (req, res, next) => {
    const activityId = req.params.aid;
    const userId = req.jwtDecoded.data.userId;

    if (!activityId) {
        return CustomError(res, "Xóa hoạt động thất bại, thử lại!", -4001);
    }

    try {
        if ((await Activity.exists({ _id: activityId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa hoạt động thất bại, thử lại!", -4101);
    }

    let activityResult;
    try {
        activityResult = await Activity.findOne({ _id: activityId }).populate(
            "child"
        );
    } catch (error) {
        return CustomError(res, "Xóa hoạt động thất bại ! Thử lại", -4102);
    }

    if (activityResult.child.userId != userId) {
        return CustomError(res, "Xóa hoạt động thất bại, thử lại!", -4002);
    }

    try {
        await Activity.deleteOne({ _id: activityResult._id });
    } catch (error) {
        return CustomError(res, "Xóa hoạt động thất bại ! Thử lại", -4103);
    }

    if (activityResult.images && activityResult.images.length > 0) {
        try {
            activityResult.images.map(
                async (item) =>
                    await imagesController.deleteImageOnCloudinary(item)
            );
        } catch (err) {
            return CustomError(res, "Xóa hoạt động thất bại ! Thử lại", -4201); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    res.json({
        message: "Success",
        status: 200,
    });
};

exports.createActivity = createActivity;
exports.getActivity = getActivity;
exports.updateActivity = updateActivity;
exports.removeActivity = removeActivity;
