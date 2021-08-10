const CustomError = require("../models/custom-error");
const Child = require("../models/child");
const User = require("../models/user");
const Note = require("../models/note");

//validator
const { validationResult } = require("express-validator");

const getAllNoteByChildID = async (req, res, next) => {
    const childId = req.params.cid;

    const { startDate, endDate } = req.query;

    if (startDate && endDate) {
        if (startDate > endDate) {
            return CustomError(
                res,
                "Lấy thông tin notes của child thất bại, thử lại!",
                -1001
            );
        }
    }

    let notes;
    try {
        notes = await Note.find({
            childId: childId,
            remindAt: {
                $gte: startDate || 0,
                $lte: endDate || process.env.MAX_DATE,
            },
        }).sort({ remindAt: -1 });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin notes của child thất bại, thử lại!",
            -1101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            notes: notes ? notes : [],
        },
    });
};

const getAllNoteByUserID = async (req, res, next) => {
    const userId = req.jwtDecoded.data.userId;

    const { startDate, endDate } = req.query;

    if (startDate && endDate) {
        if (startDate > endDate) {
            return CustomError(
                res,
                "Lấy thông tin notes của user thất bại, thử lại!",
                -6001
            );
        }
    }

    let notes;
    try {
        notes = await Note.find({
            userId: userId,
            remindAt: {
                $gte: startDate || 0,
                $lte: endDate || process.env.MAX_DATE,
            },
        }).sort({ remindAt: -1 });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin notes của user thất bại, thử lại!",
            -6101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            notes: notes ? notes : [],
        },
    });
};

const getAllReminderNoteByChildID = async (req, res, next) => {
    const childId = req.params.cid;

    let now = new Date().getTime();

    let notes;
    try {
        notes = await Note.find({
            childId,
            remindAt: {
                $lte: now,
            },
            isReminded: false,
        }).sort({ remindAt: -1 });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin notes của child thất bại, thử lại!",
            -7101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            notes: notes ? notes : [],
        },
    });
};

const getAllReminderNoteByUserID = async (req, res, next) => {
    const userId = req.jwtDecoded.data.userId;

    let now = new Date().getTime();
    let notes;
    try {
        notes = await Note.find({
            userId,
            remindAt: {
                $lte: now,
            },
            isReminded: false,
        }).sort({ remindAt: -1 });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin notes của user thất bại, thử lại!",
            -8101
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            notes: notes ? notes : [],
        },
    });
};

const updateNoteByID = async (req, res, next) => {
    const nId = req.params.nid;

    let note;
    try {
        note = await Note.findById(nId);
    } catch (err) {
        return CustomError(res, "Lấy thông tin note thất bại, thử lại!", -2101);
    }

    if (!note || note.length === 0) {
        return CustomError(res, "Không tìm thấy note được cung cấp!", -2001);
    }

    const { content, remindAt, isReminded } = req.body;

    note.content = typeof content !== "undefined" ? content : note.content;
    note.remindAt = typeof remindAt !== "undefined" ? remindAt : note.remindAt;
    note.isReminded =
        typeof isReminded !== "undefined" ? isReminded : note.isReminded;
    note.updateAt = new Date().getTime();

    try {
        await note.save();
        res.json({
            message: "Success",
            status: 200,
            data: {
                note,
            },
        });
    } catch (error) {
        return CustomError(res, "Cập nhật note thất bại, thử lại!", -2102);
    }
};

const deleteNoteByID = async (req, res, next) => {
    const nId = req.params.nid;

    let note;
    try {
        note = await Note.findByIdAndDelete(nId);
    } catch (err) {
        return CustomError(res, "Xóa note thất bại, thử lại!", -3101);
    }

    if (!note || note.length === 0) {
        return CustomError(
            res,
            "Không tìm thấy note từ noteId được cung cấp!",
            -3001
        );
    }

    try {
        await Child.findByIdAndUpdate(note.childId, {
            $pullAll: { notes: [nId] },
        });
        res.json({
            message: "Success",
            status: 200,
        });
    } catch (error) {
        return CustomError(res, "Xóa note thất bại, thử lại!", -3102);
    }
};

const createNoteByChildID = async (req, res, next) => {
    const childId = req.params.cid;
    const userId = req.jwtDecoded.data.userId;

    if (!childId) {
        return CustomError(res, "Id của bé không được rỗng", -4001);
    }

    if (!userId) {
        return CustomError(res, "Tạo note thất bại ! Thử lại", -4002);
    }

    try {
        if ((await User.exists({ _id: userId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Tạo note thất bại ! Thử lại", -4101);
    }

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(res, "Tạo note thất bại ! Thử lại", -4102);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];

        return CustomError(res, firstError, -4003);
    }

    const { content, remindAt } = req.body;

    const newNote = new Note({
        content,
        remindAt,
        childId,
        userId,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let note;
    try {
        note = await newNote.save();
    } catch (error) {
        return CustomError(res, "Thêm note thất bại, thử lại!", -4103);
    }

    try {
        await Child.findByIdAndUpdate(childId, {
            $push: { notes: [note._id] },
        });
        res.json({
            message: "Success",
            status: 200,
            data: {
                note,
            },
        });
    } catch (error) {
        return CustomError(res, "Thêm note thất bại, thử lại!", -4104);
    }
};

const getNoteByID = async (req, res, next) => {
    const nId = req.params.nid;

    let note;
    try {
        note = await Note.findById(nId);
    } catch (err) {
        return CustomError(res, "Lấy thông tin note thất bại, thử lại!", -5101);
    }

    if (!note || note.length === 0) {
        return CustomError(
            res,
            "Không tìm thấy note theo id được cung cấp!",
            -5001
        );
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            note,
        },
    });
};

exports.getAllNoteByChildID = getAllNoteByChildID;
exports.getAllNoteByUserID = getAllNoteByUserID;
exports.updateNoteByID = updateNoteByID;
exports.deleteNoteByID = deleteNoteByID;
exports.createNoteByChildID = createNoteByChildID;
exports.getNoteByID = getNoteByID;
exports.getAllReminderNoteByChildID = getAllReminderNoteByChildID;
exports.getAllReminderNoteByUserID = getAllReminderNoteByUserID;
