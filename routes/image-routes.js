const express = require("express");
const fileUpload = require("../utils/multer");
const imagesController = require("../controllers/images-controller");
const checkAuth = require("../middleware/auth");
const router = express.Router();

//router.post('/upload/guide/single/:fid', fileUpload.single('image'), imagesController.uploadGuide);

router.use(checkAuth);

router.post(
  "/upload/single",
  fileUpload.single("image"),
  imagesController.uploadSingle
);

router.post(
  "/upload/multiple",
  fileUpload.array("images"),
  imagesController.uploadMultiple
);

module.exports = router;
