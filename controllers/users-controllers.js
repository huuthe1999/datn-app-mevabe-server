/** @format */

const CustomError = require("../models/custom-error");
const User = require("../models/user");
const Status = require("../models/status");
const imagesController = require("./images-controller");

const getUserById = async (req, res, next) => {
    const userID = req.params.uid;

    let user;
    try {
        user = await User.findById(userID, "-password").populate("children");
    } catch (err) {
        return CustomError(res, "Lấy thông tin user thất bại, thử lại!", -3101);
    }

    if (!user) {
        return CustomError(
            res,
            "Không tìm thấy user từ userId được cung cấp!",
            -3001
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            user,
        },
    });
};

const getUserProfile = async (req, res, next) => {
    const dataFromTokenClient = req.jwtDecoded.data;
    if (dataFromTokenClient) {
        const userID = dataFromTokenClient.userId;
        let user;
        try {
            user = await User.findById(userID, "-password").populate(
                "children"
            );
            if (!user) {
                return CustomError(res, "Không tìm thấy user!", -2001);
            }

            res.set({
                "Cache-Control":
                    "max-age=0, no-cache, must-revalidate,proxy-revalidate",
            });

            res.json({
                message: "Success",
                status: 200,
                data: {
                    user,
                },
            });
        } catch (err) {
            return CustomError(res, "Có lỗi xảy ra khi tìm user!", -2101);
        }
    } else {
        return CustomError(res, "Không tìm thấy người dùng!", -2002);
    }
};

const updateUser = async (req, res, next) => {
    const idUser = req.jwtDecoded.data.userId;

    if (idUser) {
        let user;
        try {
            user = await User.findById(idUser);
        } catch (error) {
            return CustomError(
                res,
                "Không thể cập nhập thông tin! Thử lại",
                -4101
            ); // Không tìm thấy user
        }

        const { name, avatar } = req.body;

        if (avatar && avatar != user.avatar) {
            try {
                await imagesController.deleteImageOnCloudinary(user.avatar);
            } catch (err) {
                return CustomError(
                    res,
                    "Không thể cập nhập thông tin! Thử lại",
                    -4201
                ); //Lỗi xoá ảnh cũ trên cloudinary
            }
        }

        user.name = typeof name !== "undefined" ? name : user.name;
        user.avatar = typeof avatar !== "undefined" ? avatar : user.avatar;
        user.updateAt = new Date().getTime();

        try {
            await user.save();
            res.json({
                message: "Success",
                status: 200,
                data: {
                    user,
                },
            });
        } catch (error) {
            return CustomError(res, "Cập nhật thất bại, thử lại!", -4102);
        }
    } else {
        return CustomError(
            res,
            "Không tìm thấy Id người dùng ! Thử lại",
            -4001
        );
    }
};

const getBlockUsers = async (req, res, next) => {
    const userID = req.jwtDecoded.data.userId;
    let userList;

    try {
        userList = await User.findById(userID, "blockUsers").populate({
            path: "blockUsers",
            select: "-password",
        });
    } catch (err) {
        return CustomError(res, "Lấy blockUsers thất bại ! Thử lại", -5101);
    }
    res.json({
        message: "Success",
        status: 200,
        data: {
            userList: userList ? [...userList.blockUsers] : [],
        },
    });
};

const removeBlockUser = async (req, res, next) => {
    const userID = req.jwtDecoded.data.userId;
    const { idBlockUserList } = req.body;
    let userList;
    let isError = false;

    if (!idBlockUserList || idBlockUserList.length == 0) {
        return CustomError(res, "Xóa blockUser thất bại ! Thử lại", -6001);
    }

    // if (idBlockUserList == "all") {
    //     try {
    //         userList = await User.findOneAndUpdate(
    //             { _id: userID },
    //             {
    //                 $set: { blockUsers: [] },
    //             },
    //             { returnOriginal: false }
    //         ).populate("blockUsers");
    //     } catch (err) {
    //         return CustomError(res, "Xóa blockUser thất bại ! Thử lại", -5101);
    //     }

    //     try {
    //         await Status.updateMany(
    //             {},
    //             {
    //                 $pull: { userHiddens: userID },
    //             }
    //         );
    //     } catch (err) {
    //         return CustomError(
    //             res,
    //             "Cập nhật userHiddens trong status thất bại ! Thử lại",
    //             -5104
    //         );
    //     }

    //     return res.json({
    //         message: "Success",
    //         status: 200,
    //         data: {
    //             userList: userList ? [...userList.blockUsers] : [],
    //         },
    //     });
    // }

    let res_promises = idBlockUserList.map(async (idUser) => {
        try {
            if ((await User.exists({ _id: idUser })) == false) throw error;
        } catch (error) {
            isError = true;
            return CustomError(res, "Xóa blockUser thất bại ! Thử lại", -6103);
        }

        try {
            await User.findOneAndUpdate(
                { _id: userID },
                {
                    $pull: { blockUsers: idUser },
                },
                {
                    returnOriginal: false,
                }
            );
        } catch (err) {
            isError = true;
            return CustomError(res, "Xóa blockUser thất bại ! Thử lại", -6104);
        }

        try {
            await Status.updateMany(
                { user: idUser },
                {
                    $pull: { userHiddens: userID },
                }
            );
        } catch (err) {
            isError = true;
            return CustomError(
                res,
                "Cập nhật userHiddens trong status thất bại ! Thử lại",
                -6105
            );
        }
    });

    await Promise.all(res_promises).catch((err) => (isError = true));

    if (!isError) {
        try {
            userList = await User.findOne({ _id: userID }).populate({
                path: "blockUsers",
                select: "-password",
            });
        } catch (err) {
            isError = true;
            return CustomError(res, "Xóa blockUser thất bại ! Thử lại", -6106);
        }

        res.json({
            message: "Success",
            status: 200,
            data: {
                userList: userList ? [...userList.blockUsers] : [],
            },
        });
    }
};

exports.getUserById = getUserById;
exports.getUserProfile = getUserProfile;
exports.updateUser = updateUser;
exports.getBlockUsers = getBlockUsers;
exports.removeBlockUser = removeBlockUser;
