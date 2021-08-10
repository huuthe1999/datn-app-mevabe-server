const express = require("express");

const checkAuthAdmin = require("../middleware/adminAuth");
const guidesController = require("../controllers/guides-controllers");

const router = express.Router();

//router.use(checkAuth);

router.get("/", guidesController.getGuide);

router.get("/suggestion", guidesController.getSuggestion);

router.get("/category/all", guidesController.getAllCategory);

router.get("/:gid", guidesController.getGuideByID);

router.get("/category/:cid", guidesController.getCategoryByID);

router.use(checkAuthAdmin);

router.post("/", guidesController.createGuide);

router.post("/category", guidesController.createCategory);

router.put("/:gid", guidesController.updateGuideByID);

router.delete("/:gid", guidesController.deleteGuideByID);

module.exports = router;
