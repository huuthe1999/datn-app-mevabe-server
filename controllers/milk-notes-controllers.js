const CustomError = require("../models/custom-error");
const Child = require("../models/child");
const MilkNote = require("../models/milk-note");
const imagesController = require("./images-controller");

//validator
const { validationResult } = require("express-validator");

const getAllMilkNoteByChildID = async (req, res, next) => {
    const childId = req.params.cid;

    const { startDate, endDate } = req.query;

    if (startDate && endDate) {
        if (startDate > endDate) {
            return CustomError(
                res,
                "Lấy thông tin milkNotes của child thất bại, thử lại!",
                -1001
            );
        }
    }

    let milkNotes;
    try {
        milkNotes = await MilkNote.find({
            childId: childId,
            date: {
                $gte: startDate || 0,
                $lte: endDate || process.env.MAX_DATE,
            },
        }).sort({ date: 1 });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin milkNotes của child thất bại, thử lại!",
            -1101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            milkNotes: milkNotes ? milkNotes : [],
        },
    });
};

const updateMilkNoteByID = async (req, res, next) => {
    const mId = req.params.mid;

    let milkNote;
    try {
        milkNote = await MilkNote.findById(mId);
    } catch (err) {
        return CustomError(res, "Lấy thông tin milkNote thất bại, thử lại!", -2101);
    }

    if (!milkNote || milkNote.length === 0) {
        return CustomError(
            res,
            "Không tìm thấy milkNote từ Id được cung cấp!",
            -2001
        );
    }

    const {
        motherMilk,
        powderedMilk,
        note,
        date,
        startTime,
        endTime,
        images,
    } = req.body;

    if (images) {
        imgArrUrlRemove = milkNote.images.filter(
            (item1) => !images.some((item2) => item2 === item1)
        );
        try {
            imgArrUrlRemove.map(
                async (item) =>
                    await imagesController.deleteImageOnCloudinary(item)
            );
        } catch (err) {
            return CustomError(res, "Cập nhật milkNote thất bại ! Thử lại", -2201); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    milkNote.motherMilk =
        typeof motherMilk !== "undefined" ? motherMilk : milkNote.motherMilk;
    milkNote.powderedMilk =
        typeof powderedMilk !== "undefined"
            ? powderedMilk
            : milkNote.powderedMilk;
    milkNote.note = typeof note !== "undefined" ? note : milkNote.note;
    milkNote.date = typeof date !== "undefined" ? date : milkNote.date;
    milkNote.startTime =
        typeof startTime !== "undefined" ? startTime : milkNote.startTime;
    milkNote.endTime =
        typeof endTime !== "undefined" ? endTime : milkNote.endTime;
    milkNote.images = typeof images !== "undefined" ? images : milkNote.images;
    milkNote.updateAt = new Date().getTime();

    try {
        await milkNote.save();
        res.json({
            message: "Success",
            status: 200,
            data: {
                milkNote,
            },
        });
    } catch (error) {
        return CustomError(res, "Cập nhật milkNote thất bại, thử lại!", -2102);
    }
};

const deleteMilkNoteByID = async (req, res, next) => {
    const mId = req.params.mid;

    let note;
    try {
        note = await MilkNote.findByIdAndDelete(mId);
    } catch (err) {
        return CustomError(res, "Xóa note thất bại, thử lại!", -3101);
    }

    if (!note || note.length === 0) {
        return CustomError(
            res,
            "Không tìm thấy note từ growNoteId được cung cấp!",
            -3001
        );
    }

    if (note.images && note.images.length > 0) {
        try {
            note.images.map(
                async (item) =>
                    await imagesController.deleteImageOnCloudinary(item)
            );
        } catch (err) {
            return CustomError(res, "Xóa note thất bại ! Thử lại", -3201); //Lỗi xoá ảnh cũ trên cloudinary
        }
    }

    try {
        await Child.findByIdAndUpdate(note.childId, {
            $pullAll: { milk_notes: [mId] },
        });
        res.json({
            message: "Success",
            status: 200,
        });
    } catch (error) {
        return CustomError(res, "Xóa note thất bại, thử lại!", -3102);
    }
};

const createMilkNoteByChildID = async (req, res, next) => {
    const childId = req.params.cid;

    if (!childId) {
        return CustomError(res, "Id của bé không được rỗng", -4001);
    }

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Tạo khoảnh khắc thất bại ! Thử lại", -4101);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];

        return CustomError(res, firstError, -4002);
    }

    const {
        motherMilk,
        powderedMilk,
        note,
        date,
        startTime,
        endTime,
        images,
    } = req.body;

    const newNote = new MilkNote({
        childId,
        motherMilk,
        powderedMilk,
        note,
        date,
        startTime,
        endTime,
        images,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let milkNote;
    try {
        milkNote = await newNote.save();
    } catch (error) {
        return CustomError(res, "Thêm milkNote thất bại, thử lại!", -4102);
    }

    try {
        await Child.findByIdAndUpdate(childId, {
            $push: { milk_notes: [milkNote._id] },
        });
        res.json({
            message: "Success",
            status: 200,
            data: {
                milkNote,
            },
        });
    } catch (error) {
        return CustomError(res, "Thêm milkNote thất bại, thử lại!", -4103);
    }
};

const getMilkNoteByID = async (req, res, next) => {
    const mId = req.params.mid;

    let milkNote;
    try {
        milkNote = await MilkNote.findById(mId);
    } catch (err) {
        return CustomError(res, "Lấy thông tin milkNote thất bại, thử lại!", -5101);
    }

    if (!milkNote || milkNote.length === 0) {
        return CustomError(res, "Không tìm thấy milkNote được cung cấp!", -5001);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            milkNote,
        },
    });
};

exports.getAllMilkNoteByChildID = getAllMilkNoteByChildID;
exports.updateMilkNoteByID = updateMilkNoteByID;
exports.deleteMilkNoteByID = deleteMilkNoteByID;
exports.createMilkNoteByChildID = createMilkNoteByChildID;
exports.getMilkNoteByID = getMilkNoteByID;
