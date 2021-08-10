const express = require("express");

const notificationController = require("../helpers/pusher-admin");

const router = express.Router();

router.post("/", notificationController.pushNotificationToInterests);

router.post("/users", notificationController.pushNotificationToUsers);

router.get("/auth", notificationController.authBeams);

module.exports = router;