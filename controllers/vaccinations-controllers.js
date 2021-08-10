const CustomError = require("../models/custom-error");
const Vaccination = require("../models/vaccination");
const Vaccination_shot = require("../models/vacination-shot");
const Vaccination_shot_child = require("../models/vacination-shot-child");
const Child = require("../models/child");

const { addTimeFormat } = require("../helpers/addTimeFormat");

//validator
const { validationResult } = require("express-validator");

const createVaccination = async (req, res, next) => {
    const {
        diseaseName,
        diseaseDescription,
        content,
        sideEffects,
        isCompulsory,
    } = req.body;

    const newVaccination = new Vaccination({
        diseaseName,
        diseaseDescription,
        content,
        sideEffects,
        isCompulsory,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let vaccination;
    try {
        vaccination = await newVaccination.save();
    } catch (error) {
        return CustomError(res, "Thêm vaccination thất bại, thử lại!", -9101);
    }

    try {
        res.json({
            message: "Success",
            status: 200,
            data: {
                vaccination,
            },
        });
    } catch (error) {
        return CustomError(res, "Thêm vaccination thất bại, thử lại!", -9102);
    }
};

const createVaccinationShot = async (req, res, next) => {
    const { description, time, start, end, vaccinationId } = req.body;

    const newVaccinationShot = new Vaccination_shot({
        description,
        time,
        timeToRemind: { start, end },
        vaccinationId,
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    let vaccinationShot;
    try {
        vaccinationShot = await newVaccinationShot.save();
    } catch (error) {
        return CustomError(
            res,
            "Thêm vaccinationShot thất bại, thử lại!",
            -9101
        );
    }

    try {
        await Vaccination.findByIdAndUpdate(vaccinationId, {
            $push: { vaccinationShots: [vaccinationShot._id] },
        });
        res.json({
            message: "Success",
            status: 200,
            data: {
                vaccinationShot,
            },
        });
    } catch (error) {
        return CustomError(
            res,
            "Thêm vaccinationShot thất bại, thử lại!",
            -9102
        );
    }
};

const getAllVaccinationByChildId = async (req, res, next) => {
    const childId = req.params.cid;

    if (!childId) {
        return CustomError(
            res,
            "Lấy thông tin vaccinations thất bại, thử lại!",
            -1001
        ); // thiếu childId
    }

    let child;
    try {
        child = await Child.findById(childId);
    } catch (error) {
        return CustomError(
            res,
            "Không tìm thấy child trong database! Thử lại",
            -1101
        );
    }

    if (!child || child.userId != req.jwtDecoded.data.userId) {
        //if (!child)
        return CustomError(
            res,
            "Không tìm thấy child thuộc user và childId được cung cấp!",
            -1002
        );
    }

    let vaccinations;
    try {
        vaccinations = await Vaccination.find({})
            .populate({
                path: "vaccinationShots",
                populate: {
                    path: "vaccinationShotChild",
                    select: "status date note",
                    match: { childId: childId },
                },
            })
            .lean();
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin vaccinations thất bại, thử lại!",
            -1102
        ); // Lỗi lấy thông tin vaccinations từ database
    }

    vaccinations.map((vaccination) => {
        vaccination.vaccinationShots.map((vaccinationShot) => {
            if (vaccinationShot.vaccinationShotChild.length > 0) {
                vaccinationShot.status =
                    vaccinationShot.vaccinationShotChild[0].status;
                vaccinationShot.date =
                    vaccinationShot.vaccinationShotChild[0].date;
                vaccinationShot.note =
                    vaccinationShot.vaccinationShotChild[0].note;
            } else {
                vaccinationShot.status = 0;
            }

            delete vaccinationShot.timeToRemind;
            delete vaccinationShot.vaccinationShotChild;
            delete vaccinationShot.vaccinationId;
        });
    });

    res.json({
        message: "Success",
        status: 200,
        data: {
            vaccinations: vaccinations ? vaccinations : [],
        },
    });
};

const getVaccinationShotByIdAndChildId = async (req, res, next) => {
    const shotId = req.params.sid;
    const childId = req.params.cid;

    if (!childId || !shotId) {
        return CustomError(
            res,
            "Lấy thông tin vaccinations thất bại, thử lại!",
            -2001
        ); // thiếu childId or shotId
    }

    let child;
    try {
        child = await Child.findById(childId);
    } catch (error) {
        return CustomError(
            res,
            "Không tìm thấy child trong database! Thử lại",
            -2101
        );
    }

    if (!child || child.userId != req.jwtDecoded.data.userId) {
        //if (!child)
        return CustomError(
            res,
            "Không tìm thấy child thuộc user và childId được cung cấp!",
            -2002
        );
    }

    let vaccinationShot;
    try {
        vaccinationShot = await Vaccination_shot.findById(shotId)
            .populate("vaccinationId", "-vaccinationShots")
            .populate({
                path: "vaccinationShotChild",
                select: "status date note",
                match: { childId: childId },
            })
            .lean();
    } catch (err) {
        try {
            vaccinationShot = await Vaccination_shot.findById(
                shotId,
                "-vaccinationShotChild"
            ).populate("vaccinationId", "-vaccinationShots");
        } catch (err) {
            return CustomError(
                res,
                "Lấy thông tin vaccinationShot thất bại, thử lại!",
                -2102
            ); // Lỗi lấy thông tin vaccinationShot từ database
        }
    }

    if (!vaccinationShot) {
        return CustomError(
            res,
            "Không tìm thấy vaccinationShot từ id được cung cấp!",
            -2003
        );
    }

    if (vaccinationShot.vaccinationShotChild.length > 0) {
        vaccinationShot.status = vaccinationShot.vaccinationShotChild[0].status;
        vaccinationShot.date = vaccinationShot.vaccinationShotChild[0].date;
        vaccinationShot.note = vaccinationShot.vaccinationShotChild[0].note;
    } else {
        vaccinationShot.status = 0;
    }

    vaccinationShot.diseaseName = vaccinationShot.vaccinationId.diseaseName;
    vaccinationShot.diseaseDescription =
        vaccinationShot.vaccinationId.diseaseDescription;
    vaccinationShot.content = vaccinationShot.vaccinationId.content;
    vaccinationShot.sideEffects = vaccinationShot.vaccinationId.sideEffects;
    vaccinationShot.isCompulsory = vaccinationShot.vaccinationId.isCompulsory;

    delete vaccinationShot.vaccinationShotChild;
    delete vaccinationShot.timeToRemind;
    delete vaccinationShot.vaccinationId;

    res.json({
        message: "Success",
        status: 200,
        data: {
            vaccinationShot,
        },
    });
};

const getAllVaccinationShotsByChildId = async (req, res, next) => {
    const childId = req.params.cid;

    let { isReminder } = req.query;

    if (typeof isReminder === "undefined") {
        isReminder = false;
    }

    if (!childId) {
        return CustomError(
            res,
            "Không tìm thấy childId trong params, thử lại!",
            -5001
        ); // thiếu childId
    }

    let child;
    try {
        child = await Child.findById(childId);
    } catch (error) {
        return CustomError(
            res,
            "Không tìm thấy child trong database! Thử lại",
            -5101
        );
    }

    if (!child || child.userId != req.jwtDecoded.data.userId) {
        //if (!child)
        return CustomError(
            res,
            "Không tìm thấy child thuộc user và childId được cung cấp!",
            -5002
        );
    }

    let vaccinationShots;
    try {
        vaccinationShots = await Vaccination_shot.find({})
            .populate("vaccinationId", "-vaccinationShots")
            .populate({
                path: "vaccinationShotChild",
                select: "status date note",
                match: { childId: childId },
            })
            .sort({ "timeToRemind.start": 1 })
            .lean();
    } catch (error) {
        return CustomError(
            res,
            "Lấy thông tin vaccinationShots thất bại, thử lại!",
            -5102
        );
    }

    if (isReminder == "false" || isReminder == false) {
        vaccinationShots.map((vaccinationShot) => {
            if (vaccinationShot.vaccinationShotChild.length > 0) {
                vaccinationShot.status =
                    vaccinationShot.vaccinationShotChild[0].status;
                vaccinationShot.date =
                    vaccinationShot.vaccinationShotChild[0].date;
                vaccinationShot.note =
                    vaccinationShot.vaccinationShotChild[0].note;
            } else {
                vaccinationShot.status = 0;
            }
            vaccinationShot.diseaseName =
                vaccinationShot.vaccinationId.diseaseName;
            vaccinationShot.diseaseDescription =
                vaccinationShot.vaccinationId.diseaseDescription;
            vaccinationShot.content = vaccinationShot.vaccinationId.content;
            vaccinationShot.sideEffects =
                vaccinationShot.vaccinationId.sideEffects;
            vaccinationShot.isCompulsory =
                vaccinationShot.vaccinationId.isCompulsory;

            delete vaccinationShot.vaccinationShotChild;
            delete vaccinationShot.timeToRemind;
            delete vaccinationShot.vaccinationId;
        });

        res.json({
            message: "Success",
            status: 200,
            data: {
                vaccinationShots,
            },
        });
    } else {
        vaccinationShots.map((vaccinationShot) => {
            if (vaccinationShot.vaccinationShotChild.length > 0) {
                vaccinationShot.status =
                    vaccinationShot.vaccinationShotChild[0].status;
                vaccinationShot.date =
                    vaccinationShot.vaccinationShotChild[0].date;
                vaccinationShot.note =
                    vaccinationShot.vaccinationShotChild[0].note;
            } else {
                vaccinationShot.status = 0;
            }
        });

        let isNotPerformedVaccinationShots = [];

        vaccinationShots.map((vaccinationShot) => {
            if (vaccinationShot.status == 0) {
                vaccinationShot.diseaseName =
                    vaccinationShot.vaccinationId.diseaseName;
                vaccinationShot.diseaseDescription =
                    vaccinationShot.vaccinationId.diseaseDescription;
                vaccinationShot.content = vaccinationShot.vaccinationId.content;
                vaccinationShot.sideEffects =
                    vaccinationShot.vaccinationId.sideEffects;
                vaccinationShot.isCompulsory =
                    vaccinationShot.vaccinationId.isCompulsory;

                delete vaccinationShot.vaccinationShotChild;
                delete vaccinationShot.vaccinationId;
                delete vaccinationShot.status;
                isNotPerformedVaccinationShots.push(vaccinationShot);
            }
        });

        let vaccinationShotsReminder = [];

        let birthday = child.birthday;
        let now = new Date().getTime();

        isNotPerformedVaccinationShots.map((vaccinationShot) => {
            let timeStartReminder = addTimeFormat(
                birthday,
                vaccinationShot.timeToRemind.start
            );

            if (timeStartReminder <= now) {
                delete vaccinationShot.timeToRemind;
                vaccinationShotsReminder.push(vaccinationShot);
            }
        });

        res.json({
            message: "Success",
            status: 200,
            data: {
                vaccinationShots: vaccinationShotsReminder,
            },
        });
    }
};

const updateVaccinationShotChildByIdAndChildId = async (req, res, next) => {
    const shotId = req.params.sid;
    const childId = req.params.cid;

    const { status, date, note } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];
        return CustomError(res, firstError, -4001);
    }

    const statusList = [0, 1, 2];

    if (status && !statusList.includes(Number(status))) {
        return CustomError(
            res,
            "Gender không hợp lệ, gender phải là [0, 1, 2], thử lại!",
            -4001
        );
    }

    if (!childId || !shotId) {
        return CustomError(
            res,
            "Không tìm thấy shotId hoặc childId trong params, thử lại!",
            -4002
        ); // thiếu childId or shotId
    }

    try {
        if ((await Vaccination_shot.exists({ _id: shotId })) == false)
            throw error;
    } catch (error) {
        return CustomError(
            res,
            "Không tìm thấy vaccinationShot trong database! Thử lại",
            -4101
        );
    }

    try {
        if ((await Child.exists({ _id: childId })) == false) throw error;
    } catch (error) {
        return CustomError(
            res,
            "Không tìm thấy child trong database! Thử lại",
            -4102
        );
    }

    let vaccinationShotChild;
    try {
        vaccinationShotChild = await Vaccination_shot_child.findOne({
            vaccinationShotId: shotId,
            childId: childId,
        });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin vaccinationShotChild thất bại, thử lại!",
            -4103
        );
    }

    if (!vaccinationShotChild || vaccinationShotChild.length === 0) {
        const newVaccinationShotChild = new Vaccination_shot_child({
            status,
            date,
            note,
            vaccinationShotId: shotId,
            childId,
            createAt: new Date().getTime(),
            updateAt: new Date().getTime(),
        });

        try {
            vaccinationShotChild = await newVaccinationShotChild.save();
        } catch (error) {
            return CustomError(
                res,
                "Cập nhập vaccinationShotChild thất bại, thử lại!",
                -4104
            );
        }

        try {
            await Vaccination_shot.findByIdAndUpdate(shotId, {
                $push: { vaccinationShotChild: [vaccinationShotChild._id] },
            });

            return res.json({
                message: "Success",
                status: 200,
                data: {
                    vaccinationShotChild,
                },
            });
        } catch (error) {
            return CustomError(
                res,
                "Cập nhập vaccinationShotChild thất bại, thử lại!",
                -4104
            );
        }
    }

    vaccinationShotChild.status =
        typeof status !== "undefined" ? status : vaccinationShotChild.status;
    vaccinationShotChild.date =
        typeof date !== "undefined" ? date : vaccinationShotChild.date;
    vaccinationShotChild.note =
        typeof note !== "undefined" ? note : vaccinationShotChild.note;
    vaccinationShotChild.updateAt = new Date().getTime();

    try {
        await vaccinationShotChild.save();
        res.json({
            message: "Success",
            status: 200,
            data: {
                vaccinationShotChild,
            },
        });
    } catch (error) {
        return CustomError(
            res,
            "Cập nhật vaccinationShotChild thất bại, thử lại!",
            -4104
        );
    }
};

exports.createVaccination = createVaccination;
exports.createVaccinationShot = createVaccinationShot;
exports.getAllVaccinationByChildId = getAllVaccinationByChildId;
exports.getVaccinationShotByIdAndChildId = getVaccinationShotByIdAndChildId;
exports.getAllVaccinationShotsByChildId = getAllVaccinationShotsByChildId;
exports.updateVaccinationShotChildByIdAndChildId =
    updateVaccinationShotChildByIdAndChildId;
