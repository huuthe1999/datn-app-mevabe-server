/** @format */

const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const CustomError = require("../models/custom-error");

const checkUrlOnCloudinary = (url) => {
    const subUrls = url.split("/");

    if (subUrls[2] == "res.cloudinary.com") {
        if (subUrls[7] == "default") {
            return false;
        }
        return true;
    }
    return false;
};

const deleteImageOnCloudinary = async (url) => {
    if (checkUrlOnCloudinary(url)) {
        const subUrls = url.split("/");

        const cloudinaryId = subUrls[7] + "/" + subUrls[8].split(".")[0];

        new Promise((resolve, reject) => {
            try {
                cloudinary.uploader.destroy(cloudinaryId);
                return;
            } catch (err) {
                return reject(err); //Lỗi xoá ảnh cũ trên cloudinary
            }
        });
    }
    return;
};

const uploadSingle = async (req, res, next) => {
    if (!req.file) {
        return CustomError(res, "Không thể tải ảnh lên ! Thử lại", -1001); //Lỗi request không chứa ảnh
    }

    const file = req.file.path;

    console.log(file);

    let result;
    try {
        result = await cloudinary.uploader.upload(file, {
            folder: "single",
            use_filename: true,
        });
    } catch (err) {
        return CustomError(res, "Không thể tải ảnh lên ! Thử lại", -1201); //Lỗi upload ảnh trên cloudinary
    }

    fs.unlinkSync(file);
    let urlImage = result.secure_url;

    res.json({
        message: "Tải ảnh lên thành công",
        status: 200,
        data: {
            urlImage,
        },
    });
};

const uploadImageTemplate = async (fileImage, folderCloud, id) => {
    let result;
    try {
        result = await cloudinary.uploader.upload(fileImage, {
            folder: folderCloud + "/" + id,
            use_filename: true,
        });
    } catch (err) {
        return CustomError(res, "Không thể tải ảnh lên ! Thử lại", -9201); //Lỗi upload ảnh trên cloudinary
    }

    fs.unlinkSync(fileImage);
    let urlImage = result.secure_url;

    return urlImage;
};

const uploadMultiple = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return CustomError(res, "Không thể tải ảnh lên ! Thử lại", -2001); //Lỗi request không chứa ảnh
    }

    let arrImg = [];

    let res_promises = req.files.map(async (file) => {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "status",
                use_filename: true,
            });
            fs.unlinkSync(file.path);
            arrImg.push(result.secure_url);
        } catch (error) {
            return CustomError(res, "Không thể tải ảnh lên ! Thử lại", -2201); //Lỗi upload ảnh trên cloudinary
        }
    });

    await Promise.all(res_promises);
    res.json({
        message: "Tải ảnh lên thành công",
        status: 200,
        data: arrImg,
    });
};

exports.uploadSingle = uploadSingle;
exports.uploadMultiple = uploadMultiple;
exports.deleteImageOnCloudinary = deleteImageOnCloudinary;
exports.uploadImageTemplate = uploadImageTemplate;
