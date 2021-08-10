/** @format */

const express = require("express");

const checkAuth = require("../middleware/auth");
const statusControllers = require("../controllers/status-controllers");
const fileUpload = require("../utils/multer");
const router = express.Router();
const {
    validatorCreateStatus,
} = require("../helpers/validators/validator-status");

router.get("/", statusControllers.getStatus);

router.get("/all/user/:uid", statusControllers.getAllStatusByUserId);

router.get("/:sid", statusControllers.getStatusById);

router.get("/all/likers/:sid", statusControllers.getAllLikersStatus);

router.use(checkAuth);

router.get("/all/filterHidden", statusControllers.filterStatusHidden);

router.post("/hidden", statusControllers.addStatusHidden);

router.get("/all/child/:cid", statusControllers.getAllStatusByChildId);

router.post("/:cid", validatorCreateStatus, statusControllers.createStatus);

router.post("/like/:sid", statusControllers.likeStatus);

router.post("/dislike/:sid", statusControllers.dislikeStatus);

router.put("/:sid", statusControllers.updateStatus);

router.delete("/:sid", statusControllers.removeStatus);

module.exports = router;
