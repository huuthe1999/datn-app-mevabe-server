const CustomError = require("../models/custom-error");
const Child = require("../models/child");
const GrowNote = require("../models/grow-note");
const StandardGrowNote = require("../models/standard-grow-note");

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
        notes = await GrowNote.find({
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
        note = await GrowNote.findById(gId);
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
        note = await GrowNote.findByIdAndDelete(gId);
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
            $pullAll: { grow_notes: [gId] },
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

    const newNote = new GrowNote({
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
            $push: { grow_notes: [note._id] },
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
        note = await GrowNote.findById(gId);
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
        weights,
        heights,
        maxWeights,
        minWeights,
        maxHeights,
        minHeights,
        times,
    } = req.body;

    const newNoteStandard = new StandardGrowNote({
        isBorn,
        gender,
        weights,
        heights,
        maxWeights,
        minWeights,
        maxHeights,
        minHeights,
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
                "-gender -maxWeights -minWeights -maxHeights -minHeights"
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
                    "-weights -heights -maxWeights -maxHeights"
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
                    "-weights -heights -minWeights -minHeights"
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

    let weights = note.weights || note.minWeights || note.maxWeights;
    let heights = note.heights || note.minHeights || note.maxHeights;
    let times = note.times;

    let standard_grow_notes = [];
    times.map((t, i) => {
        let standard_grow_note = {
            weight: weights[i],
            height: heights[i],
            time: t,
        };
        standard_grow_notes.push(standard_grow_note);
    });

    res.json({
        message: "Success",
        status: 200,
        data: {
            standard_grow_notes,
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
