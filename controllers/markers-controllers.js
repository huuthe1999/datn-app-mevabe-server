/** @format */

const CustomError = require("../models/custom-error");

const Marker = require("../models/marker");

const Category = require("../models/category-marker");

const getMarker = async (req, res, next) => {
    const { markerId } = req.query;
    let markList;

    if (markerId) {
        try {
            markList = await Marker.findById(markerId).populate("category");
        } catch (err) {
            return CustomError(
                res,
                "Lấy thông tin markers thất bại, thử lại!",
                -1101
            ); // Lỗi lấy thông tin markers từ database
        }

        return res.json({
            message: "Success",
            status: 200,
            data: {
                markList: markList ? markList : [],
            },
        });
    }

    try {
        markList = await Marker.find().populate("category");
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin markers thất bại, thử lại!",
            -1102
        ); // Lỗi lấy thông tin markers từ database
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            markList: markList ? markList : [],
        },
    });
};

const createMarker = async (req, res, next) => {
    const { name, latitude, longitude, category } = req.body;

    const createMarker = new Marker({
        name,
        latitude,
        longitude,
        category,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    try {
        await createMarker.save();
    } catch (err) {
        return CustomError(res, "That bai!", -3101);
    }
    try {
        await Category.findByIdAndUpdate(category, {
            $push: { markers: [createMarker._id] },
        });
    } catch (error) {
        return CustomError(res, "That bai!", -3102);
    }

    res.json({
        message: "Tao thanh cong",
        status: 200,
        data: {
            createMarker,
        },
    });
};

const createCategory = async (req, res, next) => {
    const { name, thumbnail, type } = req.body;

    const newCategory = new Category({
        name,
        type,
        thumbnail,
        markers: [],
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let category;
    try {
        category = await newCategory.save();
        res.json({
            message: "Tao thanh cong",
            status: 200,
            data: {
                category,
            },
        });
    } catch (err) {
        return CustomError(res, "That bai!", -4101);
    }
};

const getCategory = async (req, res, next) => {
    const { categoryId } = req.query;
    let categoryList;

    if (categoryId) {
        try {
            categoryList = await Category.findById(categoryId).populate(
                "markers",
                "-category"
            );
        } catch (err) {
            return CustomError(
                res,
                "Lấy thông tin markers thất bại, thử lại!",
                -5101
            ); // Lỗi lấy thông tin markers từ database
        }

        return res.json({
            message: "Success",
            status: 200,
            data: {
                categoryList: categoryList ? categoryList : [],
            },
        });
    }

    try {
        categoryList = await Category.find({}).populate("markers", "-category");
    } catch (err) {
        return CustomError(
            res,
            "Lấy danh sách category thất bại, thử lại!",
            -5102
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            categoryList: categoryList ? categoryList : [],
        },
    });
};

const updateMarker = async (req, res, next) => {
    const markerId = req.params.idm;
    let marker;

    if (!markerId) {
        try {
            if ((await Marker.exists({ _id: markerId })) == false) throw error;
        } catch (error) {
            return CustomError(
                res,
                "Cập nhật marker thất bại ! Thử lại",
                -6101
            );
        }
    }

    try {
        marker = await Marker.findOne({ _id: markerId });
    } catch (err) {
        return CustomError(res, "Cập nhật marker thất bại, thử lại!", -6102);
    }

    const { name, latitude, longitude, type, category } = req.body;

    if (category) {
        try {
            if ((await Category.exists({ _id: category })) == false)
                throw error;
        } catch (error) {
            return CustomError(
                res,
                "Cập nhật marker thất bại ! Thử lại",
                -6103
            );
        }

        try {
            await Category.findOneAndUpdate(
                { _id: category },
                {
                    $push: {
                        markers: markerId,
                    },
                    updateAt: new Date().getTime(),
                }
            );
        } catch (err) {
            return CustomError(
                res,
                "Cập nhật marker thất bại, thử lại!",
                -6104
            );
        }

        try {
            await Category.findOneAndUpdate(
                { _id: marker.category },
                {
                    $pull: {
                        markers: markerId,
                    },
                    updateAt: new Date().getTime(),
                }
            );
        } catch (err) {
            return CustomError(
                res,
                "Cập nhật marker thất bại, thử lại!",
                -6105
            );
        }
    }

    marker.name = typeof name !== "undefined" ? name : marker.name;
    marker.latitude =
        typeof latitude !== "undefined" ? latitude : marker.latitude;
    marker.longitude =
        typeof longitude !== "undefined" ? longitude : marker.longitude;
    marker.type = typeof type !== "undefined" ? type : marker.type;
    marker.category =
        typeof category !== "undefined" ? category : marker.category;
    marker.updateAt = new Date().getTime();

    try {
        await marker.save();
    } catch (err) {
        return CustomError(
            res,
            "Cập nhật khoảnh khắc thất bại, thử lại!",
            -6106
        );
    }
    res.json({
        message: "Success",
        status: 200,
        data: {
            marker,
        },
    });
};

const removeMarker = async (req, res, next) => {
    const markerId = req.params.idm;
    let marker;

    if (!markerId) {
        try {
            if ((await Marker.exists({ _id: markerId })) == false) throw error;
        } catch (error) {
            return CustomError(res, "Xóa marker thất bại ! Thử lại", -7101);
        }
    }

    try {
        marker = await Marker.findByIdAndDelete({ _id: markerId });
    } catch (err) {
        return CustomError(res, "Xóa marker thất bại, thử lại!", -7102);
    }

    try {
        await Category.findOneAndUpdate(
            { _id: marker.category },
            {
                $pull: {
                    markers: markerId,
                },
                updateAt: new Date().getTime(),
            }
        );
    } catch (err) {
        return CustomError(res, "Xóa marker thất bại, thử lại!", -7103);
    }

    res.json({
        message: "Success",
        status: 200,
    });
};

exports.getMarker = getMarker;
exports.createMarker = createMarker;
exports.createCategory = createCategory;
exports.getCategory = getCategory;
exports.updateMarker = updateMarker;
exports.removeMarker = removeMarker;
