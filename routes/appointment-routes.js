const express = require("express");

const checkAuth = require("../middleware/auth");
const appointmentsController = require("../controllers/appointments-controllers");
const {
    validatorCreateAppointment
} = require("../helpers/validators/validator-appointment");
const router = express.Router();

router.use(checkAuth);

router.get("/:aid", appointmentsController.getAppointmentByID);

router.get("/all/:cid", appointmentsController.getAllAppointmentByChildID);

router.get("/user/all", appointmentsController.getAllAppointmentByUserID);

router.put("/:aid", appointmentsController.updateAppointmentByID);

router.delete("/:aid", appointmentsController.deleteAppointmentByID);

router.post("/:cid", validatorCreateAppointment, appointmentsController.createAppointmentByChildID);

module.exports = router;