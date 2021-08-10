const express = require("express");

const checkAuth = require("../middleware/auth");
const activityControllers = require("../controllers/activity-controllers");
const {
    validatorCreateActivity,
} = require("../helpers/validators/validator-activity");

const router = express.Router();

router.use(checkAuth);

router.post("/", validatorCreateActivity, activityControllers.createActivity);

router.get("/", activityControllers.getActivity);

router.put("/:aid", activityControllers.updateActivity);

router.delete("/:aid", activityControllers.removeActivity);

module.exports = router;
