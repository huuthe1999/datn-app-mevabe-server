/** @format */

const express = require("express");

const checkAuth = require("../middleware/auth");
const usersControllers = require("../controllers/users-controllers");
const router = express.Router();

router.get("/id/:uid", usersControllers.getUserById);

router.use(checkAuth);

router.get("/me", usersControllers.getUserProfile);

router.put("/me", usersControllers.updateUser);

router.get("/block-users", usersControllers.getBlockUsers);

router.post("/block-users", usersControllers.removeBlockUser);

module.exports = router;
