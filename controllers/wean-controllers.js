const CustomError = require("../models/custom-error");
const Wean = require("../models/wean");
const Child = require("../models/child");

const imagesController = require("./images-controller");

//validator
const { validationResult } = require("express-validator");

const createWean = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];

        return CustomError(res, firstError, -1001);
    }

    const {
        childId,
        date,
        nameFood,
        material,
        cooking,
        foodAmount,
        unit,
        note,
        images,
        rating,
    } = req.body;

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Lưu bữa ăn dặm thất bại, thử lại!", -1101);
    }

    let newWean = new Wean({
        child: childId,
        date,
        nameFood,
        cooking,
        foodAmount,
        unit,
    });

    if (typeof material !== "undefined") {
        newWean.material = material;
    }

    if (typeof note !== "undefined") {
        newWean.note = note;
    }

    if (typeof rating !== "undefined") {
        newWean.rating = rating;
    }
    if (images && images.length > 0) {
        newWean.images = images;
    }

    try {
        await newWean.save();
        await Wean.populate(newWean, {
            path: "child",
        });
    } catch (err) {
        return CustomError(res, "Lưu bữa ăn dặm thất bại, thử lại!", -1102);
    }

    try {
        await Child.findByIdAndUpdate(childId, {
            $push: { weans: [newWean._id] },
        });
    } catch (error) {
        return CustomError(res, "Lưu bữa ăn dặm thất bại, thử lại!", -1103);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            wean: newWean,
        },
    });
};

const getWean = async (req, res, next) => {
    const { weanId, childId } = req.query;
    let weanList = [];

    if (weanId && !childId) {
        try {
            if ((await Wean.exists({ _id: weanId })) == false) throw error;
        } catch (error) {
            return CustomError(res, "Lấy bữa ăn dặm thất bại, thử lại!", -2101);
        }

        try {
            const wean = await Wean.findById(weanId).populate("child");
            weanList.push(wean);
        } catch (err) {
            return CustomError(res, "Lấy bữa ăn dặm thất bại, thử lại!", -2102);
        }
        return res.json({
            message: "Success",
            status: 200,
            data: {
                weanList,
            },
        });
    }

    if (!weanId && childId) {
        try {
            if ((await Child.exists({ _id: childId })) == false) throw error;
        } catch (error) {
            return CustomError(res, "Lấy bữa ăn dặm thất bại, thử lại!", -2103);
        }

        try {
            weanList = await Wean.find({ child: childId }).populate("child");
        } catch (err) {
            return CustomError(res, "Lấy bữa ăn dặm thất bại, thử lại!", -2104);
        }
        return res.json({
            message: "Success",
            status: 200,
            data: {
                weanList,
            },
        });
    }

    if (weanId && childId) {
        try {
            if ((await Wean.exists({ _id: weanId })) == false) throw error;
        } catch (error) {
            return CustomError(res, "Lấy bữa ăn dặm thất bại, thử lại!", -2105);
        }

        try {
            if ((await Child.exists({ _id: childId })) == false) throw error;
        } catch (error) {
            return CustomError(res, "Lấy bữa ăn dặm thất bại, thử lại!", -2106);
        }

        try {
            weanList = await Wean.find({
                _id: weanId,
                child: childId,
            }).populate("child");
        } catch (err) {
            return CustomError(res, "Lấy bữa ăn dặm thất bại, thử lại!", -2107);
        }
        return res.json({
            message: "Success",
            status: 200,
            data: {
                weanList,
            },
        });
    }

    return res.json({
        message: "Success",
        status: 200,
        data: {
            weanList: [],
        },
    });
};

const getMaterial = async (req, res, next) => {
    const materialList = [
        {
            name: "Gạo",
            icon: "https://res.cloudinary.com/dknvhah81/image/upload/v1620617077/material-wean/rice-bowl_rabhyo.png",
        },
        {
            name: "Bột mì",
            icon: "https://res.cloudinary.com/dknvhah81/image/upload/v1620617391/material-wean/flour_zdorda.png",
        },
        {
            name: "Bánh mì",
            icon: "https://res.cloudinary.com/dknvhah81/image/upload/v1620617516/material-wean/bread_azejqp.png",
        },
        {
            name: "Mì",
            icon: "https://res.cloudinary.com/dknvhah81/image/upload/v1620617593/material-wean/noodles_ddvvcr.png",
        },
        {
            name: "Khoai tây",
            icon: "https://res.cloudinary.com/dknvhah81/image/upload/v1620617656/material-wean/potato_ihspmj.png",
        },
    ];
    return res.json({
        message: "Success",
        status: 200,
        data: {
            materialList,
        },
    });
};

const updateWean = async (req, res, next) => {
    const weanId = req.params.wid;
    const userId = req.jwtDecoded.data.userId;

    if (!weanId) {
        return CustomError(
            res,
            "Cập nhật bữa ăn dặm thất bại, thử lại!",
            -3001
        );
    }

    try {
        if ((await Wean.exists({ _id: weanId })) == false) throw error;
    } catch (error) {
        return CustomError(
            res,
            "Cập nhật bữa ăn dặm thất bại, thử lại!",
            -3101
        );
    }

    let weanResult;
    try {
        weanResult = await Wean.findOne({ _id: weanId }).populate("child");
    } catch (error) {
        return CustomError(
            res,
            "Cập nhật bữa ăn dặm thất bại, thử lại!",
            -3102
        );
    }

    if (weanResult.child.userId != userId) {
        return CustomError(
            res,
            "Cập nhật bữa ăn dặm thất bại, thử lại!",
            -3002
        );
    }

    const {
        date,
        nameFood,
        material,
        cooking,
        foodAmount,
        unit,
        note,
        images,
        rating,
    } = req.body;

    let imgArrUrlRemove;

    if (images && images.length > 0) {
        imgArrUrlRemove = weanResult.images.filter(
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

    weanResult.date =
        typeof date !== "undefined" && date <= new Date().getTime()
            ? date
            : weanResult.date;
    weanResult.nameFood =
        typeof nameFood !== "undefined" ? nameFood : weanResult.nameFood;
    weanResult.material =
        typeof material !== "undefined" ? material : weanResult.material;
    weanResult.cooking =
        typeof cooking !== "undefined" ? cooking : weanResult.cooking;
    weanResult.foodAmount =
        typeof foodAmount !== "undefined" ? foodAmount : weanResult.foodAmount;
    weanResult.unit = typeof unit !== "undefined" ? unit : weanResult.unit;
    weanResult.note = typeof note !== "undefined" ? note : weanResult.note;
    weanResult.rating =
        typeof rating !== "undefined" ? rating : weanResult.rating;
    weanResult.images =
        typeof images !== "undefined" && images.length > 0
            ? images
            : weanResult.images;
    weanResult.updateAt = new Date().getTime();

    try {
        await weanResult.save();
        await Wean.populate(weanResult, {
            path: "child",
        });
    } catch (err) {
        return CustomError(res, "Lưu bữa ăn dặm thất bại, thử lại!", -3103);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            wean: weanResult,
        },
    });
};

const removeWean = async (req, res, next) => {
    const weanId = req.params.wid;
    const userId = req.jwtDecoded.data.userId;

    if (!weanId) {
        return CustomError(res, "Xóa bữa ăn dặm thất bại, thử lại!", -4001);
    }

    try {
        if ((await Wean.exists({ _id: weanId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Xóa bữa ăn dặm thất bại, thử lại!", -4101);
    }

    let weanResult;
    try {
        weanResult = await Wean.findOne({ _id: weanId }).populate("child");
    } catch (error) {
        return CustomError(res, "Xóa bữa ăn dặm thất bại ! Thử lại", -4102);
    }

    if (weanResult.child.userId != userId) {
        return CustomError(res, "Xóa bữa ăn dặm thất bại, thử lại!", -4002);
    }

    try {
        await Wean.deleteOne({ _id: weanResult._id });
    } catch (error) {
        return CustomError(res, "Xóa bữa ăn dặm thất bại ! Thử lại", -4103);
    }

    if (weanResult.images && weanResult.images.length > 0) {
        try {
            weanResult.images.map(
                async (item) =>
                    await imagesController.deleteImageOnCloudinary(item)
            );
        } catch (err) {
            return CustomError(res, "Xóa bữa ăn dặm thất bại ! Thử lại", -4201); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    try {
        await Child.findByIdAndUpdate(weanResult.child._id, {
            $pull: { weans: weanResult._id },
        });
    } catch (error) {
        return CustomError(res, "Xóa bữa ăn dặm thất bại, thử lại!", -4104);
    }

    res.json({
        message: "Success",
        status: 200,
    });
};

exports.createWean = createWean;
exports.getWean = getWean;
exports.getMaterial = getMaterial;
exports.updateWean = updateWean;
exports.removeWean = removeWean;
