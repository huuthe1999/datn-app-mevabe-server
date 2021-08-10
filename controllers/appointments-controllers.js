const CustomError = require("../models/custom-error");
const mongoose = require("mongoose");
const Child = require("../models/child");
const User = require("../models/user");
const Appointment = require("../models/appointment");

//validator
const { validationResult } = require("express-validator");

const getAllAppointmentByChildID = async (req, res, next) => {
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

  let appointments;
  try {
    appointments = await Appointment.find({
      childId: childId,
      date: {
        $gte: startDate || 0,
        $lte: endDate || process.env.MAX_DATE,
      },
    }).sort({ date: -1 });
  } catch (err) {
    return CustomError(
      res,
      "Lấy thông tin appointments của child thất bại, thử lại!",
      -1101
    );
  }

  res.json({
    message: "Success",
    status: 200,
    data: {
      appointments: appointments ? appointments : [],
    },
  });
};

const getAllAppointmentByUserID = async (req, res, next) => {
  const userId = req.jwtDecoded.data.userId;

  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    if (startDate > endDate) {
      return CustomError(
        res,
        "Lấy thông tin notes của child thất bại, thử lại!",
        -6001
      );
    }
  }

  let appointments;
  try {
    appointments = await Appointment.find({
      userId: userId,
      date: {
        $gte: startDate || 0,
        $lte: endDate || process.env.MAX_DATE,
      },
    }).sort({ date: -1 });
  } catch (err) {
    return CustomError(
      res,
      "Lấy thông tin appointments của userId thất bại, thử lại!",
      -6101
    );
  }

  res.json({
    message: "Success",
    status: 200,
    data: {
      appointments: appointments ? appointments : [],
    },
  });
};

const updateAppointmentByID = async (req, res, next) => {
  const aId = req.params.aid;

  let appointment;
  try {
    appointment = await Appointment.findById(aId);
  } catch (err) {
    return CustomError(
      res,
      "Lấy thông tin appointment thất bại, thử lại!",
      -2101
    );
  }

  if (!appointment || appointment.length === 0) {
    return CustomError(res, "Không tìm thấy appointment được cung cấp!", -2001);
  }

  const { address, description, date } = req.body;

  appointment.address =
    typeof address !== "undefined" ? address : appointment.address;
  appointment.description =
    typeof description !== "undefined" ? description : appointment.description;
  appointment.date = typeof date !== "undefined" ? date : appointment.date;
  appointment.updateAt = new Date().getTime();

  try {
    await appointment.save();
    res.json({
      message: "Success",
      status: 200,
      data: {
        appointment,
      },
    });
  } catch (error) {
    return CustomError(res, "Cập nhật appointment thất bại, thử lại!", -2102);
  }
};

const deleteAppointmentByID = async (req, res, next) => {
  const aId = req.params.aid;

  let appointment;
  try {
    appointment = await Appointment.findByIdAndDelete(aId);
  } catch (err) {
    return CustomError(res, "Xóa appointment thất bại, thử lại!", -3101);
  }

  if (!appointment || appointment.length === 0) {
    return CustomError(
      res,
      "Không tìm thấy appointment từ appointmentId được cung cấp!",
      -3001
    );
  }

  try {
    await Child.findByIdAndUpdate(appointment.childId, {
      $pullAll: { appointments: [aId] },
    });
    res.json({
      message: "Success",
      status: 200,
    });
  } catch (error) {
    return CustomError(res, "Xóa appointment thất bại, thử lại!", -3102);
  }
};

const createAppointmentByChildID = async (req, res, next) => {
  const childId = req.params.cid;
  const userId = req.jwtDecoded.data.userId;

  if (!childId) {
    return CustomError(res, "Id của bé không được rỗng", -4001);
  }

  if (!userId) {
    return CustomError(res, "Tạo appointment thất bại ! Thử lại", -4002);
  }

  try {
    if ((await User.exists({ _id: userId })) == false)
      throw error;
  } catch (error) {
    return CustomError(res, "Tạo appointment thất bại ! Thử lại", -4101);
  }

  try {
    if ((await Child.exists({ _id: childId })) == false)
      throw error;
  } catch (error) {
    return CustomError(res, "Tạo appointment thất bại ! Thử lại", -4102);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array().map((error) => error.msg)[0];

    return CustomError(res, firstError, -4003);
  }

  const { address, description, date } = req.body;

  const newAppointment = new Appointment({
    address,
    description,
    date,
    childId,
    userId,
    createAt: new Date().getTime(),
    updateAt: new Date().getTime(),
  });

  let appointment;
  try {
    appointment = await newAppointment.save();
  } catch (error) {
    return CustomError(res, "Thêm appointment thất bại, thử lại!", -4103);
  }

  try {
    await Child.findByIdAndUpdate(childId, {
      $push: { appointments: [appointment._id] },
    });
    res.json({
      message: "Success",
      status: 200,
      data: {
        appointment,
      },
    });
  } catch (error) {
    return CustomError(res, "Thêm appointment thất bại, thử lại!", -4104);
  }
};

const getAppointmentByID = async (req, res, next) => {
  const aId = req.params.aid;

  let appointment;
  try {
    appointment = await Appointment.findById(aId);
  } catch (err) {
    return CustomError(
      res,
      "Lấy thông tin appointment thất bại, thử lại!",
      -5101
    );
  }

  if (!appointment || appointment.length === 0) {
    return CustomError(
      res,
      "Không tìm thấy appointment theo id được cung cấp!",
      -5001
    );
  }

  res.json({
    message: "Success",
    status: 200,
    data: {
      appointment,
    },
  });
};

exports.getAllAppointmentByChildID = getAllAppointmentByChildID;
exports.getAllAppointmentByUserID = getAllAppointmentByUserID;
exports.updateAppointmentByID = updateAppointmentByID;
exports.deleteAppointmentByID = deleteAppointmentByID;
exports.createAppointmentByChildID = createAppointmentByChildID;
exports.getAppointmentByID = getAppointmentByID;
