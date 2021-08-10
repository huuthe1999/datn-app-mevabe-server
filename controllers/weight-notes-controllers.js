const CustomError = require("../models/custom-error");
const Child = require("../models/child");
const WeightNote = require("../models/weight-note");
const StandardGrowNote = require("../models/standard-weight-note");

//validator
const { validationResult } = require("express-validator");

const getAllGrowNoteByChildID = async (req, res, next) => {
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
        notes = await WeightNote.find({
            childId: childId,
            date: {
                $gte: startDate || 0,
                $lte: endDate || process.env.MAX_DATE,
            },
        }).sort({ date: 1 });
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

const updateChildGrowNoteByID = async (req, res, next) => {
    const gId = req.params.gid;

    let note;
    try {
        note = await WeightNote.findById(gId);
    } catch (err) {
        return CustomError(res, "Lấy thông tin note thất bại, thử lại!", -2101);
    }

    if (!note || note.length === 0) {
        return CustomError(
            res,
            "Không tìm thấy note từ growNoteId được cung cấp!",
            -2001
        );
    }

    const { data, text, date } = req.body;

    note.data = typeof data !== "undefined" ? data : note.data;
    note.text = typeof text !== "undefined" ? text : note.text;
    note.date = typeof date !== "undefined" ? date : note.date;
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

const deleteChildGrowNoteByID = async (req, res, next) => {
    const gId = req.params.gid;

    let note;
    try {
        note = await WeightNote.findByIdAndDelete(gId);
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

    try {
        await Child.findByIdAndUpdate(note.childId, {
            $pullAll: { weight_notes: [gId] },
        });
        res.json({
            message: "Success",
            status: 200,
        });
    } catch (error) {
        return CustomError(res, "Xóa note thất bại, thử lại!", -3102);
    }
};

const createGrowNoteByChildID = async (req, res, next) => {
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

    const { data, text, date } = req.body;

    const newNote = new WeightNote({
        childId,
        data,
        text,
        date,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let note;
    try {
        note = await newNote.save();
    } catch (error) {
        return CustomError(res, "Thêm note thất bại, thử lại!", -4102);
    }

    try {
        await Child.findByIdAndUpdate(childId, {
            $push: { weight_notes: [note._id] },
        });
        res.json({
            message: "Success",
            status: 200,
            data: {
                note,
            },
        });
    } catch (error) {
        return CustomError(res, "Thêm note thất bại, thử lại!", -4103);
    }
};

const getGrowNoteByID = async (req, res, next) => {
    const gId = req.params.gid;

    let note;
    try {
        note = await WeightNote.findById(gId);
    } catch (err) {
        return CustomError(res, "Lấy thông tin note thất bại, thử lại!", -5101);
    }

    if (!note || note.length === 0) {
        return CustomError(res, "Không tìm thấy note được cung cấp!", -5001);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            note,
        },
    });
};

const createStandardGrowNote = async (req, res, next) => {
    const {
        isBorn,
        gender,
        data,
        maxData,
        minData,
        times,
    } = req.body;

    const newNoteStandard = new StandardGrowNote({
        isBorn,
        gender,
        data,
        maxData,
        minData,
        times,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let note;
    try {
        note = await newNoteStandard.save();
    } catch (error) {
        return CustomError(res, "Thêm note thất bại, thử lại!", -9102);
    }

    res.json({
        message: "Success",
        status: 200,
        data: {
            note,
        },
    });
};

const getStandardGrowNote = async (req, res, next) => {
    let { isBorn, gender, isMax } = req.query;

    let note;

    const genderList = [0, 1, 2];

    if (!isBorn) isBorn = false;
    if (!gender) gender = 0;
    if (!isMax) isMax = false;

    if (!genderList.includes(Number(gender))) {
        return CustomError(
            res,
            "Gender không hợp lệ, gender phải là [0, 1, 2], thử lại!",
            -6001
        );
    }

    if (isBorn == false || isBorn == "false") {
        try {
            note = await StandardGrowNote.findOne(
                {
                    isBorn: false,
                },
                "-gender -maxData -minData"
            );
        } catch (error) {
            return CustomError(
                res,
                "Lấy thông tin standard note thất bại, thử lại!",
                -6101
            );
        }
    } else {
        if (isMax == false || isMax == "false") {
            try {
                note = await StandardGrowNote.findOne(
                    {
                        isBorn: isBorn,
                        gender: gender,
                    },
                    "-data -maxData"
                );
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy thông tin standard note thất bại, thử lại!",
                    -6101
                );
            }
        } else {
            try {
                note = await StandardGrowNote.findOne(
                    {
                        isBorn: isBorn,
                        gender: gender,
                    },
                    "-data -minData"
                );
            } catch (error) {
                return CustomError(
                    res,
                    "Lấy thông tin standard note thất bại, thử lại!",
                    -6101
                );
            }
        }
    }

    let dataArray = note.data || note.minData || note. maxData;
    let times = note.times;

    let standard_notes = [];
    times.map((t, i) => {
        let standard_note = {
            data: dataArray[i],
            time: t,
        };
        standard_notes.push(standard_note);
    });

    res.json({
        message: "Success",
        status: 200,
        data: {
            standard_notes,
        },
    });
};

exports.getAllGrowNoteByChildID = getAllGrowNoteByChildID;
exports.updateChildGrowNoteByID = updateChildGrowNoteByID;
exports.deleteChildGrowNoteByID = deleteChildGrowNoteByID;
exports.createGrowNoteByChildID = createGrowNoteByChildID;
exports.getGrowNoteByID = getGrowNoteByID;
exports.createStandardGrowNote = createStandardGrowNote;
exports.getStandardGrowNote = getStandardGrowNote;