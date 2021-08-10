/** @format */

const express = require("express");

const markersController = require("../controllers/markers-controllers");
const checkAuthAdmin = require("../middleware/adminAuth");
const router = express.Router();

router.get("/", markersController.getMarker);

router.get("/category", markersController.getCategory);

router.use(checkAuthAdmin);

router.post("/", markersController.createMarker);

router.post("/category", markersController.createCategory);

router.put("/:idm", markersController.updateMarker);

router.delete("/:idm", markersController.removeMarker);

module.exports = router;
